export type ProviderConfig = {
  openAiApiKey: string;
  pineconeApiKey: string;
  pineconeIndex: string;
  pineconeHost?: string;
  embeddingModel: string;
  chatModel: string;
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
  vectorIds: string[];
  createdAt: string;
  createdBy: string;
};

export type RagSettingsRecord = ProviderConfig & {
  namespace: string;
  updatedAt: string;
  updatedBy: string;
};
