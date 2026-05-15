import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import type { DocumentRecord, ProviderConfig } from "./types";

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

const createOpenAIClient = (apiKey: string) => new OpenAI({ apiKey });

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
  const chunks = chunkDocument(document.sourceText);
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
        chunkIndex: index + 1
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
    .map((match, index) => ({
      id: index + 1,
      content: String(match.metadata?.text || ""),
      score: Number((match.score || 0).toFixed(4)),
      group: String(match.metadata?.group || ""),
      documentId: String(match.metadata?.documentId || ""),
      title: String(match.metadata?.title || "Document")
    }))
    .filter((chunk) => chunk.content) satisfies ChunkMatch[];
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
