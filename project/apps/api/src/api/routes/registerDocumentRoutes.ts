import { t } from "elysia";
import { deleteDocumentVectors } from "../../rag";
import { toDocumentSummary } from "../apiMappers";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  createIndexDocumentForUser,
  getFileExtension,
  normalizeDocumentTitle
} from "../createDocumentIndexingService";
import {
  badRequest,
  forbidden,
  handleError,
  isPineconeMissingResourceError,
  notFound,
  requireConfiguredRag,
  unauthorized
} from "../apiResponses";
import type { AnyElysiaApp, ApiRouteDependencies } from "../apiTypes";

export const registerDocumentRoutes = (
  app: AnyElysiaApp,
  { store, getAuthenticatedUser }: ApiRouteDependencies
) => {
  const indexDocumentForUser = createIndexDocumentForUser(store);

  return app
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
        .filter(
          (value: FormDataEntryValue): value is File => value instanceof File
        );

      if (!group) {
        return badRequest(set, "Le groupe est obligatoire.");
      }

      if (!files.length) {
        return badRequest(set, "Au moins un fichier doit etre fourni.");
      }

      if (
        chunkMode !== undefined &&
        !["characters", "words", "tokens"].includes(chunkMode)
      ) {
        return badRequest(
          set,
          "Le mode de chunking doit etre characters, words ou tokens."
        );
      }

      if (
        files.some(
          (file: File) =>
            !ALLOWED_DOCUMENT_EXTENSIONS.has(getFileExtension(file.name))
        )
      ) {
        return badRequest(
          set,
          "Seuls les fichiers texte, markdown et md sont acceptes."
        );
      }

      const uploadedDocuments: Array<ReturnType<typeof toDocumentSummary>> = [];

      for (const file of files) {
        const sourceText = await file.text();
        const result = await indexDocumentForUser({
          title: normalizeDocumentTitle(file.name),
          group,
          sourceText,
          chunkMode: chunkMode as "characters" | "words" | "tokens" | undefined,
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

      const ragSettings = requireConfiguredRag(store, set);
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
    });
};
