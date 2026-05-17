import { t } from "elysia";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_CHUNK_MODE,
  DEFAULT_EMBEDDING_MODEL,
  PINECONE_NAMESPACE,
  generateAnswer,
  getChunkingConfig,
  isChunkMode,
  queryAccessibleChunks,
  resolvePineconeHost
} from "../../rag";
import { toRagSettingsSummary } from "../apiMappers";
import {
  badRequest,
  forbidden,
  handleError,
  requireConfiguredRag,
  unauthorized
} from "../apiResponses";
import type { AnyElysiaApp, ApiRouteDependencies } from "../apiTypes";

export const registerRagRoutes = (
  app: AnyElysiaApp,
  { store, getAuthenticatedUser }: ApiRouteDependencies
) =>
  app
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

        const ragSettings = requireConfiguredRag(store, set);
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
    );
