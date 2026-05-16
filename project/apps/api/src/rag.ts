import OpenAI from "openai";
import { getEncoding } from "js-tiktoken";
import { createRequire } from "node:module";
import type { ChunkMode, DocumentRecord, ProviderConfig } from "./types";

type PineconeRecordMetadata = Record<string, unknown>;

type PineconeIndexDescription = {
  host?: string;
};

type PineconeQueryMatch = {
  score?: number;
  metadata?: PineconeRecordMetadata;
};

type PineconeQueryResponse = {
  matches?: PineconeQueryMatch[];
};

type PineconeVectorRecord = {
  id: string;
  values: number[];
  metadata: PineconeRecordMetadata;
};

type PineconeNamespace = {
  upsert(records: PineconeVectorRecord[]): Promise<void>;
  deleteMany(options: string[]): Promise<void>;
  query(options: {
    topK: number;
    vector: number[];
    includeMetadata: boolean;
    filter?: PineconeRecordMetadata;
  }): Promise<PineconeQueryResponse>;
};

type PineconeIndexHandle = {
  namespace(namespace: string): PineconeNamespace;
};

type PineconeClient = {
  describeIndex(indexName: string): Promise<PineconeIndexDescription>;
  index(indexName: string, host?: string): PineconeIndexHandle;
};

type PineconeConstructor = new (options: { apiKey: string }) => PineconeClient;

const require = createRequire(import.meta.url);
const { Pinecone } = require("@pinecone-database/pinecone") as {
  Pinecone: PineconeConstructor;
};

export type ChunkMatch = {
  id: number;
  content: string;
  score: number;
  group: string;
  documentId: string;
  title: string;
};

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";
export const PINECONE_NAMESPACE = "rag-demo";
export const DEFAULT_CHUNK_MODE = "characters" satisfies ChunkMode;
export const DEFAULT_CHUNK_SIZE = 320;
export const DEFAULT_CHUNK_OVERLAP = 40;

const tokenEncoder = getEncoding("cl100k_base");

const createOpenAIClient = (apiKey: string) => new OpenAI({ apiKey });

export const isChunkMode = (value: unknown): value is ChunkMode =>
  value === "characters" || value === "words" || value === "tokens";

const normalizeDocument = (document: string) =>
  document.replace(/\s+/g, " ").trim();

export const getChunkingConfig = (
  config?: Pick<ProviderConfig, "chunkMode" | "chunkSize" | "chunkOverlap">
) => {
  const chunkMode = isChunkMode(config?.chunkMode)
    ? config.chunkMode
    : DEFAULT_CHUNK_MODE;
  const chunkSize = Math.max(
    1,
    Math.floor(config?.chunkSize ?? DEFAULT_CHUNK_SIZE)
  );
  const chunkOverlap = Math.min(
    Math.max(0, Math.floor(config?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP)),
    Math.max(chunkSize - 1, 0)
  );

  return {
    chunkMode,
    chunkSize,
    chunkOverlap,
    chunkStride: Math.max(1, chunkSize - chunkOverlap)
  };
};

const chunkByCharacters = (
  document: string,
  chunkSize: number,
  stride: number
) => {
  const chunks: string[] = [];

  for (let startIndex = 0; startIndex < document.length; startIndex += stride) {
    const chunk = document.slice(startIndex, startIndex + chunkSize).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (startIndex + chunkSize >= document.length) {
      break;
    }
  }

  return chunks;
};

const chunkByWords = (document: string, chunkSize: number, stride: number) => {
  const words = document.split(" ").filter(Boolean);
  const chunks: string[] = [];

  for (let startIndex = 0; startIndex < words.length; startIndex += stride) {
    const chunkWords = words.slice(startIndex, startIndex + chunkSize);
    const chunk = chunkWords.join(" ").trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (startIndex + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
};

const chunkByTokens = (document: string, chunkSize: number, stride: number) => {
  const encoded = tokenEncoder.encode(document);
  const chunks: string[] = [];

  for (let startIndex = 0; startIndex < encoded.length; startIndex += stride) {
    const tokenWindow = encoded.slice(startIndex, startIndex + chunkSize);
    const chunk = tokenEncoder.decode(tokenWindow).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (startIndex + chunkSize >= encoded.length) {
      break;
    }
  }

  return chunks;
};

export const resolvePineconeHost = async (
  config: Pick<
    ProviderConfig,
    "pineconeApiKey" | "pineconeIndex" | "pineconeHost"
  >
) => {
  if (config.pineconeHost) {
    return config.pineconeHost;
  }

  try {
    const client = new Pinecone({ apiKey: config.pineconeApiKey });
    const indexDescription = await client.describeIndex(config.pineconeIndex);
    return indexDescription.host;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur Pinecone inconnue.";
    throw new Error(
      `Impossible de resoudre automatiquement le host Pinecone pour l'index ${config.pineconeIndex}. Reconfigurez le backend RAG avec le host Pinecone explicite. Detail: ${message}`
    );
  }
};

const createPineconeNamespace = async (config: ProviderConfig) => {
  const indexHost = await resolvePineconeHost(config);

  if (!indexHost) {
    throw new Error(
      `Impossible de resoudre le host Pinecone pour l'index ${config.pineconeIndex}.`
    );
  }

  const client = new Pinecone({ apiKey: config.pineconeApiKey });
  const index = client.index(config.pineconeIndex, indexHost);

  return index.namespace(PINECONE_NAMESPACE);
};

export const chunkDocument = (
  document: string,
  config?: Pick<ProviderConfig, "chunkMode" | "chunkSize" | "chunkOverlap">
) => {
  const normalizedDocument = normalizeDocument(document);

  if (!normalizedDocument) {
    return [];
  }

  const { chunkMode, chunkSize, chunkStride } = getChunkingConfig(config);

  if (chunkMode === "words") {
    return chunkByWords(normalizedDocument, chunkSize, chunkStride);
  }

  if (chunkMode === "tokens") {
    return chunkByTokens(normalizedDocument, chunkSize, chunkStride);
  }

  return chunkByCharacters(normalizedDocument, chunkSize, chunkStride);
};

const embedTexts = async (config: ProviderConfig, inputs: string[]) => {
  const openai = createOpenAIClient(config.openAiApiKey);
  const response = await openai.embeddings.create({
    model: config.embeddingModel,
    input: inputs
  });

  return response.data.map((item) => item.embedding);
};

export const indexDocumentInPinecone = async (
  config: ProviderConfig,
  document: Pick<
    DocumentRecord,
    "id" | "title" | "group" | "sourceText" | "createdBy"
  >
) => {
  const chunkConfig = getChunkingConfig(config);
  const chunks = chunkDocument(document.sourceText, chunkConfig);
  const embeddings = await embedTexts(config, chunks);
  const namespace = await createPineconeNamespace(config);
  const vectorIds = chunks.map(
    (_, index) => `${document.id}-chunk-${index + 1}`
  );

  await namespace.upsert(
    chunks.map((content, index) => ({
      id: vectorIds[index],
      values: embeddings[index],
      metadata: {
        text: content,
        group: document.group,
        title: document.title,
        documentId: document.id,
        createdBy: document.createdBy,
        chunkIndex: index + 1,
        chunkMode: chunkConfig.chunkMode,
        chunkSize: chunkConfig.chunkSize,
        chunkOverlap: chunkConfig.chunkOverlap
      }
    }))
  );

  return {
    chunkCount: chunks.length,
    vectorIds
  };
};

export const deleteDocumentVectors = async (
  config: ProviderConfig,
  vectorIds: string[]
) => {
  if (!vectorIds.length) {
    return;
  }

  const namespace = await createPineconeNamespace(config);
  await namespace.deleteMany(vectorIds);
};

export const queryAccessibleChunks = async (
  config: ProviderConfig,
  question: string,
  allowedGroups: string[]
) => {
  const [questionEmbedding] = await embedTexts(config, [question]);
  const namespace = await createPineconeNamespace(config);
  const filter =
    allowedGroups.length === 1
      ? { group: { $eq: allowedGroups[0] } }
      : { group: { $in: allowedGroups } };

  const queryResponse = await namespace.query({
    topK: 6,
    vector: questionEmbedding,
    includeMetadata: true,
    filter
  });

  return (queryResponse.matches || [])
    .map((match: PineconeQueryMatch, index: number) => ({
      id: index + 1,
      content: String(match.metadata?.text || ""),
      score: Number((match.score || 0).toFixed(4)),
      group: String(match.metadata?.group || ""),
      documentId: String(match.metadata?.documentId || ""),
      title: String(match.metadata?.title || "Document")
    }))
    .filter((chunk: ChunkMatch) => chunk.content) satisfies ChunkMatch[];
};

export const generateAnswer = async (
  config: ProviderConfig,
  question: string,
  retrievedChunks: ChunkMatch[]
) => {
  if (!retrievedChunks.length) {
    return "Je n'ai trouve aucun document accessible suffisamment pertinent pour cette question.";
  }

  const openai = createOpenAIClient(config.openAiApiKey);
  const contextBlock = retrievedChunks
    .map(
      (chunk) =>
        `[Source ${chunk.id} | ${chunk.title} | groupe ${chunk.group} | score ${chunk.score.toFixed(3)}]\n${chunk.content}`
    )
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: config.chatModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Tu es un assistant RAG. Reponds en francais a partir du contexte fourni uniquement. Si l'information manque, dis-le clairement. Cite les sources sous la forme [Source X]."
      },
      {
        role: "user",
        content: `Question: ${question}\n\nContexte:\n${contextBlock}`
      }
    ]
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Le modele n'a pas renvoye de contenu exploitable."
  );
};
