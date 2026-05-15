import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

type ChunkMatch = {
  content: string;
  score: number;
  id: number;
};

type SessionConfig = {
  openAiApiKey: string;
  pineconeApiKey: string;
  pineconeIndex: string;
  pineconeHost?: string;
  embeddingModel: string;
  chatModel: string;
  activeNamespace?: string;
};

const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";
const sessionConfigs = new Map<string, SessionConfig>();

const STOP_WORDS = new Set([
  "a",
  "ai",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "dans",
  "de",
  "des",
  "du",
  "elle",
  "en",
  "et",
  "est",
  "il",
  "je",
  "la",
  "le",
  "les",
  "leur",
  "mais",
  "mes",
  "ne",
  "nos",
  "notre",
  "nous",
  "ou",
  "par",
  "pas",
  "pour",
  "que",
  "qui",
  "sa",
  "se",
  "ses",
  "son",
  "sur",
  "tes",
  "toi",
  "ton",
  "tu",
  "un",
  "une",
  "vos",
  "votre",
  "vous"
]);

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const sanitizeNamespacePart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "demo";

const chunkDocument = (document: string, maxChunkLength = 320) => {
  const paragraphs = document
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (!buffer) {
      buffer = paragraph;
      continue;
    }

    if ((buffer + "\n\n" + paragraph).length <= maxChunkLength) {
      buffer += `\n\n${paragraph}`;
      continue;
    }

    chunks.push(buffer);
    buffer = paragraph;
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChunkLength) {
      return [chunk];
    }

    const sentences = chunk
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const smallerChunks: string[] = [];
    let sentenceBuffer = "";

    for (const sentence of sentences) {
      const candidate = sentenceBuffer
        ? `${sentenceBuffer} ${sentence}`
        : sentence;
      if (candidate.length <= maxChunkLength) {
        sentenceBuffer = candidate;
        continue;
      }

      if (sentenceBuffer) {
        smallerChunks.push(sentenceBuffer);
      }
      sentenceBuffer = sentence;
    }

    if (sentenceBuffer) {
      smallerChunks.push(sentenceBuffer);
    }

    return smallerChunks;
  });
};

const scoreChunk = (questionTokens: string[], chunk: string): number => {
  const chunkTokens = new Set(tokenize(chunk));
  if (!chunkTokens.size) {
    return 0;
  }

  const overlap = questionTokens.filter((token) =>
    chunkTokens.has(token)
  ).length;
  const densityBoost = overlap / Math.max(chunkTokens.size, 1);
  return overlap * 10 + densityBoost;
};

const createOpenAIClient = (apiKey: string) => new OpenAI({ apiKey });

const createPineconeIndex = (config: SessionConfig) => {
  const client = new Pinecone({ apiKey: config.pineconeApiKey });

  return config.pineconeHost
    ? client.index(config.pineconeIndex, config.pineconeHost)
    : client.index(config.pineconeIndex);
};

const getSessionConfig = (sessionId: string) => sessionConfigs.get(sessionId);

const buildNamespace = (sessionId: string) =>
  `${sanitizeNamespacePart("rag-demo")}-${sanitizeNamespacePart(
    sessionId.slice(0, 8)
  )}-${Date.now().toString(36)}`;

const embedTexts = async (config: SessionConfig, inputs: string[]) => {
  const openai = createOpenAIClient(config.openAiApiKey);
  const response = await openai.embeddings.create({
    model: config.embeddingModel,
    input: inputs
  });

  return response.data.map((item) => item.embedding);
};

const generateAnswer = async (
  config: SessionConfig,
  question: string,
  retrievedChunks: ChunkMatch[]
) => {
  if (!retrievedChunks.length) {
    return "Je n'ai trouvé aucun passage pertinent dans Pinecone pour cette question.";
  }

  const openai = createOpenAIClient(config.openAiApiKey);
  const contextBlock = retrievedChunks
    .map(
      (chunk) =>
        `[Source ${chunk.id} | score ${chunk.score.toFixed(3)}]\n${chunk.content}`
    )
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: config.chatModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Tu es un assistant RAG. Réponds en français. Utilise uniquement le contexte fourni. Si l'information est absente, dis-le explicitement. Cite les sources sous la forme [Source X] dans la réponse."
      },
      {
        role: "user",
        content: `Question: ${question}\n\nContexte:\n${contextBlock}`
      }
    ]
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Le modèle n'a pas renvoyé de contenu exploitable."
  );
};

const handleError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
};

const app = new Elysia()
  .use(
    cors({
      origin: true
    })
  )
  .get("/api/health", () => ({ status: "ok", configuredSessions: sessionConfigs.size }))
  .post(
    "/api/configure",
    ({ body, set }) => {
      const sessionId = crypto.randomUUID();
      sessionConfigs.set(sessionId, {
        openAiApiKey: body.openAiApiKey,
        pineconeApiKey: body.pineconeApiKey,
        pineconeIndex: body.pineconeIndex,
        pineconeHost: body.pineconeHost,
        embeddingModel: body.embeddingModel || DEFAULT_EMBEDDING_MODEL,
        chatModel: body.chatModel || DEFAULT_CHAT_MODEL
      });

      set.status = 201;
      return {
        sessionId,
        config: {
          pineconeIndex: body.pineconeIndex,
          pineconeHost: body.pineconeHost || null,
          embeddingModel: body.embeddingModel || DEFAULT_EMBEDDING_MODEL,
          chatModel: body.chatModel || DEFAULT_CHAT_MODEL
        }
      };
    },
    {
      body: t.Object({
        openAiApiKey: t.String({ minLength: 20 }),
        pineconeApiKey: t.String({ minLength: 20 }),
        pineconeIndex: t.String({ minLength: 3 }),
        pineconeHost: t.Optional(t.String({ minLength: 1 })),
        embeddingModel: t.Optional(t.String({ minLength: 3 })),
        chatModel: t.Optional(t.String({ minLength: 3 }))
      })
    }
  )
  .post(
    "/api/index",
    async ({ body, set }) => {
      const sessionConfig = getSessionConfig(body.sessionId);

      if (!sessionConfig) {
        set.status = 404;
        return { error: "Session de configuration introuvable." };
      }

      try {
        const chunks = chunkDocument(body.documents);
        const embeddings = await embedTexts(sessionConfig, chunks);
        const namespace = buildNamespace(body.sessionId);
        const index = createPineconeIndex(sessionConfig).namespace(namespace);

        await index.upsert(
          chunks.map((content, index) => ({
            id: `${body.sessionId}-${index + 1}-${Date.now().toString(36)}`,
            values: embeddings[index],
            metadata: {
              text: content,
              chunkIndex: index + 1,
              tokenEstimate: tokenize(content).length
            }
          }))
        );

        sessionConfig.activeNamespace = namespace;

        return {
          sessionId: body.sessionId,
          namespace,
          chunkCount: chunks.length,
          embeddingModel: sessionConfig.embeddingModel
        };
      } catch (error) {
        set.status = 500;
        return { error: handleError(error) };
      }
    },
    {
      body: t.Object({
        sessionId: t.String({ minLength: 3 }),
        documents: t.String({ minLength: 20 })
      })
    }
  )
  .post(
    "/api/query",
    async ({ body, set }) => {
      const sessionConfig = getSessionConfig(body.sessionId);

      if (!sessionConfig) {
        set.status = 404;
        return { error: "Session de configuration introuvable." };
      }

      if (!sessionConfig.activeNamespace) {
        set.status = 409;
        return {
          error: "Aucun corpus n'a encore été indexé pour cette session."
        };
      }

      try {
        const [questionEmbedding] = await embedTexts(sessionConfig, [body.question]);
        const queryResponse = await createPineconeIndex(sessionConfig)
          .namespace(sessionConfig.activeNamespace)
          .query({
            topK: 4,
            vector: questionEmbedding,
            includeMetadata: true
          });

        const retrievedChunks: ChunkMatch[] = (queryResponse.matches || [])
          .map((match, index) => ({
            id: index + 1,
            content: String(match.metadata?.text || ""),
            score: Number((match.score || 0).toFixed(4))
          }))
          .filter((chunk) => chunk.content);

        const answer = await generateAnswer(
          sessionConfig,
          body.question,
          retrievedChunks
        );

        return {
          question: body.question,
          answer,
          namespace: sessionConfig.activeNamespace,
          chatModel: sessionConfig.chatModel,
          embeddingModel: sessionConfig.embeddingModel,
          retrievedChunks
        };
      } catch (error) {
        set.status = 500;
        return { error: handleError(error) };
      }
    },
    {
      body: t.Object({
        sessionId: t.String({ minLength: 3 }),
        question: t.String({ minLength: 3 })
      })
    }
  )
  .listen(3000);

console.log(
  `RAG API running on http://${app.server?.hostname}:${app.server?.port}`
);
