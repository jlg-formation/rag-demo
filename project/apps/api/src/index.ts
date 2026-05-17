import { cors } from "@elysiajs/cors";
import { access } from "node:fs/promises";
import { extname, normalize } from "node:path";
import { Elysia, t } from "elysia";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_CHUNK_MODE,
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_EMBEDDING_MODEL,
  PINECONE_NAMESPACE,
  deleteDocumentVectors,
  generateAnswer,
  getChunkingConfig,
  indexDocumentInPinecone,
  isChunkMode,
  queryAccessibleChunks,
  resolvePineconeHost
} from "./rag";
import {
  buildExpiredSessionCookie,
  buildSessionCookie,
  getSessionIdFromCookieHeader,
  isSpinalCase,
  normalizeEmail,
  verifyPassword
} from "./security";
import { DataStore } from "./store";
import type {
  ChunkMode,
  DocumentRecord,
  ProviderConfig,
  RagSettingsRecord,
  UserRecord
} from "./types";

const WEB_DIST_DIR = new URL("../../web/dist/", import.meta.url);
const WEB_INDEX_FILE = Bun.file(new URL("index.html", WEB_DIST_DIR));

const store = await DataStore.create();

const handleError = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Une erreur inattendue est survenue.";

const resolveStaticFile = async (requestPath: string) => {
  const normalizedPath = normalize(requestPath).replace(/^([.][./\\])+/, "");
  const relativePath = normalizedPath.replace(/^[/\\]+/, "");
  const fileUrl = new URL(relativePath, WEB_DIST_DIR);

  try {
    await access(fileUrl);
    return Bun.file(fileUrl);
  } catch {
    return null;
  }
};

const serveFrontend = async (requestPath: string, set: ResponseSet) => {
  const assetPath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const assetFile = await resolveStaticFile(assetPath);

  if (assetFile) {
    return assetFile;
  }

  if (extname(requestPath)) {
    set.status = 404;
    return { error: "Ressource introuvable." };
  }

  return WEB_INDEX_FILE;
};

const isPineconeMissingResourceError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    /pinecone/i.test(error.message) &&
    /HTTP status 404|returned 404|status 404|not found/i.test(error.message)
  );
};

type ResponseSet = {
  status?: number | string;
};

const toUserSummary = (user: UserRecord) => ({
  email: user.email,
  displayName: user.displayName,
  groups: user.groups,
  isAdmin: user.groups.includes("admin"),
  createdAt: user.createdAt
});

const toDocumentSummary = (document: DocumentRecord) => ({
  id: document.id,
  title: document.title,
  group: document.group,
  sourceText: document.sourceText,
  chunkCount: document.chunkCount,
  chunkMode: document.chunkMode ?? DEFAULT_CHUNK_MODE,
  chunkSize: document.chunkSize ?? DEFAULT_CHUNK_SIZE,
  chunkOverlap: document.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP,
  createdAt: document.createdAt,
  createdBy: document.createdBy
});

const getSecretLastCharacters = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  return value.length <= 4 ? value : value.slice(-4);
};

const toRagSettingsSummary = (settings: RagSettingsRecord | null) =>
  settings
    ? (() => {
        const { chunkSize, chunkOverlap, chunkStride } =
          getChunkingConfig(settings);

        return {
          configured: true,
          openAiApiKeyConfigured: Boolean(settings.openAiApiKey),
          openAiApiKeyLast4: getSecretLastCharacters(settings.openAiApiKey),
          pineconeApiKeyConfigured: Boolean(settings.pineconeApiKey),
          pineconeApiKeyLast4: getSecretLastCharacters(settings.pineconeApiKey),
          pineconeIndex: settings.pineconeIndex,
          pineconeHost: settings.pineconeHost || null,
          embeddingModel: settings.embeddingModel,
          chatModel: settings.chatModel,
          chunkMode: settings.chunkMode ?? DEFAULT_CHUNK_MODE,
          chunkSize,
          chunkOverlap,
          chunkStride,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy,
          namespace: settings.namespace
        };
      })()
    : {
        configured: false,
        openAiApiKeyConfigured: false,
        openAiApiKeyLast4: null,
        pineconeApiKeyConfigured: false,
        pineconeApiKeyLast4: null,
        pineconeIndex: null,
        pineconeHost: null,
        embeddingModel: null,
        chatModel: null,
        chunkMode: DEFAULT_CHUNK_MODE,
        chunkSize: DEFAULT_CHUNK_SIZE,
        chunkOverlap: DEFAULT_CHUNK_OVERLAP,
        chunkStride: DEFAULT_CHUNK_SIZE - DEFAULT_CHUNK_OVERLAP,
        updatedAt: null,
        updatedBy: null,
        namespace: null
      };

const getAuthenticatedUser = async (request: Request) => {
  await store.purgeExpiredSessions();
  const sessionId = getSessionIdFromCookieHeader(request.headers.get("cookie"));

  if (!sessionId) {
    return null;
  }

  const session = store.getSessionById(sessionId);
  if (!session) {
    return null;
  }

  const user = store.getUserByEmail(session.userEmail);
  if (!user) {
    await store.deleteSession(session.id);
    return null;
  }

  return {
    session,
    user,
    isAdmin: user.groups.includes("admin")
  };
};

const unauthorized = (
  set: ResponseSet,
  message = "Authentification requise."
) => {
  set.status = 401;
  return { error: message };
};

const forbidden = (set: ResponseSet, message = "Acces interdit.") => {
  set.status = 403;
  return { error: message };
};

const notFound = (set: ResponseSet, message: string) => {
  set.status = 404;
  return { error: message };
};

const badRequest = (set: ResponseSet, message: string) => {
  set.status = 400;
  return { error: message };
};

const conflict = (set: ResponseSet, message: string) => {
  set.status = 409;
  return { error: message };
};

const requireConfiguredRag = (set: ResponseSet) => {
  const settings = store.getRagSettings();
  if (!settings) {
    set.status = 409;
    return { error: "Le backend RAG n'est pas encore configure." };
  }

  return settings;
};

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".txt", ".md", ".markdown"]);

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
};

const normalizeDocumentTitle = (rawTitle: string) => {
  const title = rawTitle.trim();
  if (!title) {
    return "";
  }

  return title.replace(/\.[^.]+$/, "").trim() || title;
};

const indexDocumentForUser = async (input: {
  title: string;
  group: string;
  sourceText: string;
  chunkMode?: ChunkMode;
  chunkSize?: number;
  chunkOverlap?: number;
  user: UserRecord;
  set: ResponseSet;
}) => {
  const title = input.title.trim();
  const group = input.group.trim();
  const sourceText = input.sourceText.trim();

  if (!title || !group || !sourceText) {
    return badRequest(
      input.set,
      "Titre, groupe et contenu du document sont obligatoires."
    );
  }

  if (!store.hasGroup(group)) {
    return notFound(input.set, "Le groupe indique n'existe pas.");
  }

  if (!input.user.groups.includes(group)) {
    return forbidden(
      input.set,
      "Vous ne pouvez indexer un document que pour un groupe auquel vous appartenez."
    );
  }

  const ragSettings = requireConfiguredRag(input.set);
  if ("error" in ragSettings) {
    return ragSettings;
  }

  const resolvedChunkMode =
    input.chunkMode ?? ragSettings.chunkMode ?? DEFAULT_CHUNK_MODE;

  if (!isChunkMode(resolvedChunkMode)) {
    return badRequest(
      input.set,
      "Le mode de chunking doit etre characters, words ou tokens."
    );
  }

  const { chunkMode, chunkSize, chunkOverlap } = getChunkingConfig({
    chunkMode: resolvedChunkMode,
    chunkSize: input.chunkSize ?? ragSettings.chunkSize,
    chunkOverlap: input.chunkOverlap ?? ragSettings.chunkOverlap
  });

  if (chunkOverlap >= chunkSize) {
    return badRequest(
      input.set,
      "L'overlap doit rester strictement inferieur a la taille de chunk."
    );
  }

  try {
    const documentId = crypto.randomUUID();
    const indexed = await indexDocumentInPinecone(
      {
        ...ragSettings,
        chunkMode,
        chunkSize,
        chunkOverlap
      },
      {
        id: documentId,
        title,
        group,
        sourceText,
        createdBy: input.user.email
      }
    );

    const document = await store.createDocument({
      id: documentId,
      title,
      group,
      sourceText,
      chunkCount: indexed.chunkCount,
      chunkMode,
      chunkSize,
      chunkOverlap,
      vectorIds: indexed.vectorIds,
      createdAt: new Date().toISOString(),
      createdBy: input.user.email
    });

    return { document: toDocumentSummary(document) };
  } catch (error) {
    input.set.status = 500;
    return { error: handleError(error) };
  }
};

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true
    })
  )
  .get("/api/health", () => ({
    status: "ok",
    users: store.getUsers().length,
    groups: store.getGroups().length,
    documents: store.getDocuments().length,
    ragConfigured: Boolean(store.getRagSettings())
  }))
  .get("/api/auth/me", async ({ request, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    return {
      user: toUserSummary(auth.user),
      ragConfig: toRagSettingsSummary(store.getRagSettings())
    };
  })
  .post(
    "/api/auth/login",
    async ({ body, set }) => {
      if (!body.email.trim() || !body.password) {
        return badRequest(set, "Les identifiants sont obligatoires.");
      }

      const user = store.getUserByEmail(body.email);

      if (!user) {
        return unauthorized(set, "Identifiants invalides.");
      }

      const isValidPassword = await verifyPassword(
        body.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        return unauthorized(set, "Identifiants invalides.");
      }

      const session = await store.createSession(user.email);
      set.headers["Set-Cookie"] = buildSessionCookie(session.id);

      return {
        user: toUserSummary(user),
        ragConfig: toRagSettingsSummary(store.getRagSettings())
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String()
      })
    }
  )
  .post("/api/auth/logout", async ({ request, set }) => {
    const sessionId = getSessionIdFromCookieHeader(
      request.headers.get("cookie")
    );

    if (sessionId) {
      await store.deleteSession(sessionId);
    }

    set.headers["Set-Cookie"] = buildExpiredSessionCookie();
    return { ok: true };
  })
  .get("/api/groups", async ({ request, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    const groups = auth.isAdmin
      ? store.getGroups()
      : store
          .getGroups()
          .filter((group) => auth.user.groups.includes(group.name));

    return { groups };
  })
  .post(
    "/api/groups",
    async ({ request, body, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      if (!auth.isAdmin) {
        return forbidden(
          set,
          "Seuls les administrateurs peuvent creer des groupes."
        );
      }

      if (!body.name.trim()) {
        return badRequest(set, "Le nom du groupe est obligatoire.");
      }

      if (!isSpinalCase(body.name)) {
        return badRequest(
          set,
          "Le nom du groupe doit etre strictement en spinal-case."
        );
      }

      try {
        const group = await store.createGroup(body.name);
        set.status = 201;
        return { group };
      } catch (error) {
        return conflict(set, handleError(error));
      }
    },
    {
      body: t.Object({
        name: t.String()
      })
    }
  )
  .get("/api/users", async ({ request, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    if (!auth.isAdmin) {
      return forbidden(
        set,
        "Seuls les administrateurs peuvent voir les comptes."
      );
    }

    return {
      users: store.getUsers().map((user) => toUserSummary(user))
    };
  })
  .post(
    "/api/users",
    async ({ request, body, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      if (!auth.isAdmin) {
        return forbidden(
          set,
          "Seuls les administrateurs peuvent creer des comptes."
        );
      }

      if (!body.email.trim() || !body.password) {
        return badRequest(
          set,
          "L'identifiant et le mot de passe sont obligatoires."
        );
      }

      const uniqueGroups = Array.from(new Set(body.groups as string[]));
      if (!uniqueGroups.length) {
        return badRequest(
          set,
          "Un utilisateur doit appartenir a au moins un groupe."
        );
      }

      if (uniqueGroups.some((group) => !store.hasGroup(group))) {
        return badRequest(
          set,
          "Tous les groupes associes au compte doivent exister."
        );
      }

      try {
        const user = await store.createUser({
          email: normalizeEmail(body.email),
          password: body.password,
          displayName: body.displayName,
          groups: uniqueGroups
        });
        set.status = 201;
        return { user: toUserSummary(user) };
      } catch (error) {
        return conflict(set, handleError(error));
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        displayName: t.Optional(t.String()),
        groups: t.Array(t.String(), { minItems: 1 })
      })
    }
  )
  .get("/api/documents", async ({ request, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    return {
      documents: store
        .getDocumentsForGroups(auth.user.groups)
        .map((document) => toDocumentSummary(document))
    };
  })
  .post(
    "/api/documents",
    async ({ request, body, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      const result = await indexDocumentForUser({
        title: body.title,
        group: body.group,
        sourceText: body.sourceText,
        chunkMode: body.chunkMode,
        chunkSize: body.chunkSize,
        chunkOverlap: body.chunkOverlap,
        user: auth.user,
        set
      });

      if ("document" in result) {
        set.status = 201;
      }

      return result;
    },
    {
      body: t.Object({
        title: t.String(),
        group: t.String(),
        sourceText: t.String(),
        chunkMode: t.Optional(
          t.Union([
            t.Literal("characters"),
            t.Literal("words"),
            t.Literal("tokens")
          ])
        ),
        chunkSize: t.Optional(t.Number()),
        chunkOverlap: t.Optional(t.Number())
      })
    }
  )
  .post("/api/documents/upload", async ({ request, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    const formData = await request.formData();
    const group = String(formData.get("group") || "").trim();
    const chunkModeValue = formData.get("chunkMode");
    const chunkMode =
      typeof chunkModeValue === "string" && chunkModeValue.trim()
        ? chunkModeValue.trim()
        : undefined;
    const chunkSize = Number(formData.get("chunkSize") || "") || undefined;
    const chunkOverlap =
      Number(formData.get("chunkOverlap") || "") || undefined;
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!group) {
      return badRequest(set, "Le groupe est obligatoire.");
    }

    if (!files.length) {
      return badRequest(set, "Au moins un fichier doit etre fourni.");
    }

    if (chunkMode !== undefined && !isChunkMode(chunkMode)) {
      return badRequest(
        set,
        "Le mode de chunking doit etre characters, words ou tokens."
      );
    }

    if (
      files.some(
        (file) => !ALLOWED_DOCUMENT_EXTENSIONS.has(getFileExtension(file.name))
      )
    ) {
      return badRequest(
        set,
        "Seuls les fichiers texte, markdown et md sont acceptes."
      );
    }

    const uploadedDocuments: ReturnType<typeof toDocumentSummary>[] = [];

    for (const file of files) {
      const sourceText = await file.text();
      const result = await indexDocumentForUser({
        title: normalizeDocumentTitle(file.name),
        group,
        sourceText,
        chunkMode,
        chunkSize,
        chunkOverlap,
        user: auth.user,
        set
      });

      if ("error" in result) {
        return result;
      }

      uploadedDocuments.push(result.document);
    }

    set.status = 201;
    return { documents: uploadedDocuments };
  })
  .delete("/api/documents/:id", async ({ request, params, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    const document = store.getDocumentById(params.id);
    if (!document) {
      return notFound(set, "Document introuvable.");
    }

    if (!auth.user.groups.includes(document.group)) {
      return forbidden(
        set,
        "Vous ne pouvez supprimer que les documents de vos groupes."
      );
    }

    const ragSettings = requireConfiguredRag(set);
    if ("error" in ragSettings) {
      return ragSettings;
    }

    try {
      try {
        await deleteDocumentVectors(ragSettings, document.vectorIds);
      } catch (error) {
        if (!isPineconeMissingResourceError(error)) {
          throw error;
        }
      }

      await store.deleteDocument(document.id);
      return { ok: true };
    } catch (error) {
      set.status = 500;
      return { error: handleError(error) };
    }
  })
  .get("/api/rag/config", async ({ request, set }) => {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return unauthorized(set);
    }

    return {
      ragConfig: toRagSettingsSummary(store.getRagSettings())
    };
  })
  .post(
    "/api/rag/configure",
    async ({ request, body, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      if (!auth.isAdmin) {
        return forbidden(
          set,
          "Seuls les administrateurs peuvent configurer le backend RAG."
        );
      }

      const existingSettings = store.getRagSettings();
      const nextOpenAiApiKey = body.openAiApiKey?.trim()
        ? body.openAiApiKey.trim()
        : body.openAiApiKey === undefined
          ? existingSettings?.openAiApiKey
          : "";
      const nextPineconeApiKey = body.pineconeApiKey?.trim()
        ? body.pineconeApiKey.trim()
        : body.pineconeApiKey === undefined
          ? existingSettings?.pineconeApiKey
          : "";
      const nextPineconeIndex = body.pineconeIndex.trim();
      const nextPineconeHost = body.pineconeHost?.trim()
        ? body.pineconeHost.trim()
        : undefined;
      const nextChunkMode =
        body.chunkMode ?? existingSettings?.chunkMode ?? DEFAULT_CHUNK_MODE;

      if (!isChunkMode(nextChunkMode)) {
        return badRequest(
          set,
          "Le mode de chunking doit etre characters, words ou tokens."
        );
      }

      const { chunkSize: nextChunkSize, chunkOverlap: nextChunkOverlap } =
        getChunkingConfig({
          chunkMode: nextChunkMode,
          chunkSize: body.chunkSize ?? existingSettings?.chunkSize,
          chunkOverlap: body.chunkOverlap ?? existingSettings?.chunkOverlap
        });

      if (!nextOpenAiApiKey || !nextPineconeApiKey || !nextPineconeIndex) {
        return badRequest(
          set,
          "La configuration OpenAI et Pinecone est incomplete."
        );
      }

      if (nextChunkOverlap >= nextChunkSize) {
        return badRequest(
          set,
          "L'overlap doit rester strictement inferieur a la taille de chunk."
        );
      }

      try {
        const pineconeHost = await resolvePineconeHost({
          pineconeApiKey: nextPineconeApiKey,
          pineconeIndex: nextPineconeIndex,
          pineconeHost: nextPineconeHost
        });

        const settings = await store.setRagSettings({
          openAiApiKey: nextOpenAiApiKey,
          pineconeApiKey: nextPineconeApiKey,
          pineconeIndex: nextPineconeIndex,
          pineconeHost,
          embeddingModel: body.embeddingModel || DEFAULT_EMBEDDING_MODEL,
          chatModel: body.chatModel || DEFAULT_CHAT_MODEL,
          chunkMode: nextChunkMode,
          chunkSize: nextChunkSize,
          chunkOverlap: nextChunkOverlap,
          namespace: PINECONE_NAMESPACE,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.user.email
        });

        return {
          ragConfig: toRagSettingsSummary(settings)
        };
      } catch (error) {
        set.status = 500;
        return {
          error: nextPineconeHost
            ? handleError(error)
            : `${handleError(error)} Fournissez explicitement le host Pinecone si l'index ne peut pas etre resolu automatiquement.`
        };
      }
    },
    {
      body: t.Object({
        openAiApiKey: t.Optional(t.String()),
        pineconeApiKey: t.Optional(t.String()),
        pineconeIndex: t.String(),
        pineconeHost: t.Optional(t.String()),
        embeddingModel: t.Optional(t.String()),
        chatModel: t.Optional(t.String()),
        chunkMode: t.Optional(
          t.Union([
            t.Literal("characters"),
            t.Literal("words"),
            t.Literal("tokens")
          ])
        ),
        chunkSize: t.Optional(t.Number()),
        chunkOverlap: t.Optional(t.Number())
      })
    }
  )
  .post(
    "/api/rag/query",
    async ({ request, body, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      if (!body.question.trim()) {
        return badRequest(set, "La question est obligatoire.");
      }

      const ragSettings = requireConfiguredRag(set);
      if ("error" in ragSettings) {
        return ragSettings;
      }

      try {
        const retrievedChunks = await queryAccessibleChunks(
          ragSettings,
          body.question,
          auth.user.groups
        );
        const answer = await generateAnswer(
          ragSettings,
          body.question,
          retrievedChunks
        );

        return {
          question: body.question,
          answer,
          retrievedChunks,
          ragConfig: toRagSettingsSummary(ragSettings)
        };
      } catch (error) {
        set.status = 500;
        return { error: handleError(error) };
      }
    },
    {
      body: t.Object({
        question: t.String()
      })
    }
  )
  .get("/", ({ set }) => serveFrontend("/", set))
  .get("/*", ({ params, set }) => serveFrontend(`/${params["*"]}`, set))
  .listen(Number(process.env.PORT || 3000));

console.log(
  `RAG API running on http://${app.server?.hostname}:${app.server?.port}`
);
