export type ChunkMode = "characters" | "words" | "tokens";

export type UserSummary = {
  email: string;
  displayName: string | null;
  groups: string[];
  isAdmin: boolean;
  createdAt: string;
};

export type GroupSummary = {
  name: string;
  createdAt: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  group: string;
  sourceText: string;
  chunkCount: number;
  chunkMode: ChunkMode;
  chunkSize: number;
  chunkOverlap: number;
  createdAt: string;
  createdBy: string;
};

export type RagConfigSummary = {
  configured: boolean;
  openAiApiKeyConfigured: boolean;
  openAiApiKeyLast4: string | null;
  pineconeApiKeyConfigured: boolean;
  pineconeApiKeyLast4: string | null;
  pineconeIndex: string | null;
  pineconeHost: string | null;
  embeddingModel: string | null;
  chatModel: string | null;
  chunkMode: ChunkMode;
  chunkSize: number;
  chunkOverlap: number;
  chunkStride: number;
  updatedAt: string | null;
  updatedBy: string | null;
  namespace: string | null;
};

export type AuthPayload = {
  user: UserSummary;
  ragConfig: RagConfigSummary;
};

export type DocumentsPayload = {
  documents: DocumentSummary[];
};

export type UploadedDocumentsPayload = {
  documents: DocumentSummary[];
};

export type GroupsPayload = {
  groups: GroupSummary[];
};

export type UsersPayload = {
  users: UserSummary[];
};

export type RetrievedChunk = {
  id: number;
  content: string;
  score: number;
  group: string;
  documentId: string;
  title: string;
};

export type QueryResponse = {
  question: string;
  answer: string;
  ragConfig: RagConfigSummary;
  retrievedChunks: RetrievedChunk[];
};

export type DashboardContextValue = {
  user: UserSummary;
  ragConfig: RagConfigSummary;
  setRagConfig: (value: RagConfigSummary) => void;
  resetAuth: () => void;
  logout: () => Promise<void>;
};
