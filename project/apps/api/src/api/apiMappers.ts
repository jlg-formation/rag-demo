import {
  DEFAULT_CHUNK_MODE,
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  getChunkingConfig
} from "../rag";
import type { DocumentRecord, RagSettingsRecord, UserRecord } from "../types";

export const toUserSummary = (user: UserRecord) => ({
  email: user.email,
  displayName: user.displayName,
  groups: user.groups,
  isAdmin: user.groups.includes("admin"),
  createdAt: user.createdAt
});

export const toDocumentSummary = (document: DocumentRecord) => ({
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

export const toRagSettingsSummary = (settings: RagSettingsRecord | null) =>
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
