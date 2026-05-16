export type ChunkMode = "characters" | "words" | "tokens";

export type ProviderConfig = {
  openAiApiKey: string;
  pineconeApiKey: string;
  pineconeIndex: string;
  pineconeHost?: string;
  embeddingModel: string;
  chatModel: string;
  chunkMode?: ChunkMode;
  chunkSize?: number;
  chunkOverlap?: number;
};

export type GroupRecord = {
  name: string;
  createdAt: string;
};

export type UserRecord = {
  email: string;
  passwordHash: string;
  displayName: string | null;
  groups: string[];
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  userEmail: string;
  createdAt: string;
  expiresAt: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  group: string;
  sourceText: string;
  chunkCount: number;
  chunkMode?: ChunkMode;
  chunkSize?: number;
  chunkOverlap?: number;
  vectorIds: string[];
  createdAt: string;
  createdBy: string;
};

export type RagSettingsRecord = ProviderConfig & {
  namespace: string;
  updatedAt: string;
  updatedBy: string;
};
