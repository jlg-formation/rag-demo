import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_EMBEDDING_MODEL,
  PINECONE_NAMESPACE,
  deleteDocumentVectors,
  generateAnswer,
  indexDocumentInPinecone,
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
  DocumentRecord,
  ProviderConfig,
  RagSettingsRecord,
  UserRecord
} from "./types";

const store = await DataStore.create();

const handleError = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Une erreur inattendue est survenue.";

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
  createdAt: document.createdAt,
  createdBy: document.createdBy
});

const toRagSettingsSummary = (settings: RagSettingsRecord | null) =>
  settings
    ? {
        configured: true,
        pineconeIndex: settings.pineconeIndex,
        pineconeHost: settings.pineconeHost || null,
        embeddingModel: settings.embeddingModel,
        chatModel: settings.chatModel,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy,
        namespace: settings.namespace
      }
    : {
        configured: false,
        pineconeIndex: null,
        pineconeHost: null,
        embeddingModel: null,
        chatModel: null,
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

      if (!body.title.trim() || !body.group.trim() || !body.sourceText.trim()) {
        return badRequest(
          set,
          "Titre, groupe et contenu du document sont obligatoires."
        );
      }

      if (!store.hasGroup(body.group)) {
        return notFound(set, "Le groupe indique n'existe pas.");
      }

      if (!auth.user.groups.includes(body.group)) {
        return forbidden(
          set,
          "Vous ne pouvez indexer un document que pour un groupe auquel vous appartenez."
        );
      }

      const ragSettings = requireConfiguredRag(set);
      if ("error" in ragSettings) {
        return ragSettings;
      }

      try {
        const documentId = crypto.randomUUID();
        const indexed = await indexDocumentInPinecone(ragSettings, {
          id: documentId,
          title: body.title.trim(),
          group: body.group,
          sourceText: body.sourceText,
          createdBy: auth.user.email
        });

        const document = await store.createDocument({
          id: documentId,
          title: body.title.trim(),
          group: body.group,
          sourceText: body.sourceText,
          chunkCount: indexed.chunkCount,
          vectorIds: indexed.vectorIds,
          createdAt: new Date().toISOString(),
          createdBy: auth.user.email
        });

        set.status = 201;
        return { document: toDocumentSummary(document) };
      } catch (error) {
        set.status = 500;
        return { error: handleError(error) };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        group: t.String(),
        sourceText: t.String()
      })
    }
  )
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

      if (
        !body.openAiApiKey.trim() ||
        !body.pineconeApiKey.trim() ||
        !body.pineconeIndex.trim()
      ) {
        return badRequest(
          set,
          "La configuration OpenAI et Pinecone est incomplete."
        );
      }

      try {
        const pineconeHost = await resolvePineconeHost({
          pineconeApiKey: body.pineconeApiKey,
          pineconeIndex: body.pineconeIndex,
          pineconeHost: body.pineconeHost
        });

        const settings = await store.setRagSettings({
          openAiApiKey: body.openAiApiKey,
          pineconeApiKey: body.pineconeApiKey,
          pineconeIndex: body.pineconeIndex,
          pineconeHost,
          embeddingModel: body.embeddingModel || DEFAULT_EMBEDDING_MODEL,
          chatModel: body.chatModel || DEFAULT_CHAT_MODEL,
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
          error: body.pineconeHost?.trim()
            ? handleError(error)
            : `${handleError(error)} Fournissez explicitement le host Pinecone si l'index ne peut pas etre resolu automatiquement.`
        };
      }
    },
    {
      body: t.Object({
        openAiApiKey: t.String(),
        pineconeApiKey: t.String(),
        pineconeIndex: t.String(),
        pineconeHost: t.Optional(t.String()),
        embeddingModel: t.Optional(t.String()),
        chatModel: t.Optional(t.String())
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
  .listen(3000);

console.log(
  `RAG API running on http://${app.server?.hostname}:${app.server?.port}`
);
