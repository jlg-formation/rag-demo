import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { GetAuthenticatedUser } from "./api/apiTypes";
import { createApp } from "./createApp";
import type { DataStore } from "./store";
import type {
  DocumentRecord,
  RagSettingsRecord,
  SessionRecord,
  UserRecord
} from "./types";

const mockedResolvePineconeHost = mock(async () => "mocked-pinecone-host");
const mockedQueryAccessibleChunks = mock(async () => [
  {
    id: 1,
    content: "Passage de test",
    score: 0.91,
    group: "patients",
    documentId: "doc-1",
    title: "Guide patient"
  }
]);
const mockedGenerateAnswer = mock(
  async () => "## Reponse courte\n\nReponse mockee."
);
const mockedDeleteDocumentVectors = mock(async () => {});
const mockedIndexDocumentInPinecone = mock(async () => ({
  chunkCount: 2,
  vectorIds: ["vec-1", "vec-2"]
}));

mock.module("./rag", () => ({
  DEFAULT_CHAT_MODEL: "gpt-4.1-mini",
  DEFAULT_CHUNK_MODE: "characters",
  DEFAULT_CHUNK_OVERLAP: 40,
  DEFAULT_CHUNK_SIZE: 320,
  DEFAULT_EMBEDDING_MODEL: "text-embedding-3-small",
  PINECONE_NAMESPACE: "rag-demo",
  deleteDocumentVectors: mockedDeleteDocumentVectors,
  generateAnswer: mockedGenerateAnswer,
  getChunkingConfig: ({ chunkMode, chunkSize, chunkOverlap }: any = {}) => ({
    chunkMode: chunkMode ?? "characters",
    chunkSize: chunkSize ?? 320,
    chunkOverlap: chunkOverlap ?? 40,
    chunkStride: (chunkSize ?? 320) - (chunkOverlap ?? 40)
  }),
  indexDocumentInPinecone: mockedIndexDocumentInPinecone,
  isChunkMode: (value: string) =>
    value === "characters" || value === "words" || value === "tokens",
  queryAccessibleChunks: mockedQueryAccessibleChunks,
  resolvePineconeHost: mockedResolvePineconeHost
}));

const createAdminUser = (): UserRecord => ({
  email: "admin@example.com",
  passwordHash: "hash",
  displayName: "Admin",
  groups: ["admin", "patients"],
  createdAt: "2026-01-01T00:00:00.000Z"
});

const createPatientUser = (): UserRecord => ({
  email: "patient@example.com",
  passwordHash: "hash",
  displayName: "Patient",
  groups: ["patients"],
  createdAt: "2026-01-01T00:00:00.000Z"
});

const createRagSettings = (): RagSettingsRecord => ({
  openAiApiKey: "openai-key",
  pineconeApiKey: "pinecone-key",
  pineconeIndex: "demo-index",
  pineconeHost: "configured-host",
  embeddingModel: "text-embedding-3-small",
  chatModel: "gpt-4.1-mini",
  chunkMode: "characters",
  chunkSize: 320,
  chunkOverlap: 40,
  namespace: "rag-demo",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "admin@example.com"
});

const createDocument = (): DocumentRecord => ({
  id: "doc-1",
  title: "Guide patient",
  group: "patients",
  sourceText: "Contenu du document",
  chunkCount: 2,
  chunkMode: "characters",
  chunkSize: 320,
  chunkOverlap: 40,
  vectorIds: ["vec-1", "vec-2"],
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: "admin@example.com"
});

const createStoreStub = (overrides?: Partial<Record<string, unknown>>) => {
  let ragSettings: RagSettingsRecord | null = createRagSettings();
  const documents = [createDocument()];
  const sessions: SessionRecord[] = [];

  return {
    getUsers: () => [createAdminUser()],
    getGroups: () => [
      { name: "admin", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "patients", createdAt: "2026-01-01T00:00:00.000Z" }
    ],
    getDocuments: () => [...documents],
    getDocumentsForGroups: (groups: string[]) =>
      documents.filter((document) => groups.includes(document.group)),
    getDocumentById: (documentId: string) =>
      documents.find((document) => document.id === documentId) || null,
    deleteDocument: mock(async (documentId: string) => {
      const index = documents.findIndex(
        (document) => document.id === documentId
      );
      if (index >= 0) {
        documents.splice(index, 1);
      }
    }),
    hasGroup: (group: string) => group === "patients" || group === "admin",
    createDocument: mock(async (document: DocumentRecord) => {
      documents.push(document);
      return document;
    }),
    getRagSettings: () => ragSettings,
    setRagSettings: mock(async (settings: RagSettingsRecord) => {
      ragSettings = settings;
      return settings;
    }),
    getUserByEmail: (email: string) =>
      email === "admin@example.com" ? createAdminUser() : null,
    createSession: async (userEmail: string) => {
      const session = {
        id: `session-${sessions.length + 1}`,
        userEmail,
        createdAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2099-01-01T00:00:00.000Z"
      } satisfies SessionRecord;
      sessions.push(session);
      return session;
    },
    deleteSession: async () => {},
    ...overrides
  } as unknown as DataStore;
};

const createJsonRequest = (
  url: string,
  method: "POST" | "DELETE",
  body?: unknown
) =>
  new Request(url, {
    method,
    headers: body
      ? {
          "content-type": "application/json"
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

const createAuthenticatedUser =
  (user: UserRecord): GetAuthenticatedUser =>
  async () => ({
    session: {
      id: "session-1",
      userEmail: user.email,
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2099-01-01T00:00:00.000Z"
    },
    user,
    isAdmin: user.groups.includes("admin")
  });

describe("createApp RAG integration", () => {
  beforeEach(() => {
    mockedResolvePineconeHost.mockClear();
    mockedQueryAccessibleChunks.mockClear();
    mockedGenerateAnswer.mockClear();
    mockedDeleteDocumentVectors.mockClear();
    mockedIndexDocumentInPinecone.mockClear();
    mockedResolvePineconeHost.mockImplementation(
      async () => "mocked-pinecone-host"
    );
    mockedQueryAccessibleChunks.mockImplementation(async () => [
      {
        id: 1,
        content: "Passage de test",
        score: 0.91,
        group: "patients",
        documentId: "doc-1",
        title: "Guide patient"
      }
    ]);
    mockedGenerateAnswer.mockImplementation(
      async () => "## Reponse courte\n\nReponse mockee."
    );
    mockedDeleteDocumentVectors.mockImplementation(async () => {});
    mockedIndexDocumentInPinecone.mockImplementation(async () => ({
      chunkCount: 2,
      vectorIds: ["vec-1", "vec-2"]
    }));
  });

  it("configures RAG without calling real Pinecone", async () => {
    const store = createStoreStub();
    const app = createApp({
      store,
      getAuthenticatedUser: createAuthenticatedUser(createAdminUser())
    });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/rag/configure", "POST", {
        openAiApiKey: "new-openai-key",
        pineconeApiKey: "new-pinecone-key",
        pineconeIndex: "new-index",
        chunkMode: "words",
        chunkSize: 20,
        chunkOverlap: 5
      })
    );

    expect(response.status).toBe(200);
    expect(mockedResolvePineconeHost).toHaveBeenCalledTimes(1);
    expect(await response.json()).toMatchObject({
      ragConfig: {
        configured: true,
        pineconeHost: "mocked-pinecone-host",
        pineconeIndex: "new-index",
        chunkMode: "words",
        chunkSize: 20,
        chunkOverlap: 5,
        namespace: "rag-demo"
      }
    });
  });

  it("queries RAG with mocked Pinecone retrieval and mocked OpenAI answer", async () => {
    const app = createApp({
      store: createStoreStub(),
      getAuthenticatedUser: createAuthenticatedUser(createPatientUser())
    });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/rag/query", "POST", {
        question: "Quel est le protocole ?"
      })
    );

    expect(response.status).toBe(200);
    expect(mockedQueryAccessibleChunks).toHaveBeenCalledTimes(1);
    expect(mockedGenerateAnswer).toHaveBeenCalledTimes(1);
    expect(await response.json()).toMatchObject({
      question: "Quel est le protocole ?",
      answer: "## Reponse courte\n\nReponse mockee.",
      retrievedChunks: [
        {
          id: 1,
          title: "Guide patient",
          group: "patients"
        }
      ]
    });
  });

  it("returns 500 when mocked Pinecone host resolution fails", async () => {
    mockedResolvePineconeHost.mockImplementationOnce(async () => {
      throw new Error("Pinecone mock failure");
    });

    const app = createApp({
      store: createStoreStub(),
      getAuthenticatedUser: createAuthenticatedUser(createAdminUser())
    });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/rag/configure", "POST", {
        openAiApiKey: "new-openai-key",
        pineconeApiKey: "new-pinecone-key",
        pineconeIndex: "new-index"
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error:
        "Pinecone mock failure Fournissez explicitement le host Pinecone si l'index ne peut pas etre resolu automatiquement."
    });
  });

  it("returns 500 when mocked retrieval fails during a RAG query", async () => {
    mockedQueryAccessibleChunks.mockImplementationOnce(async () => {
      throw new Error("Query mock failure");
    });

    const app = createApp({
      store: createStoreStub(),
      getAuthenticatedUser: createAuthenticatedUser(createPatientUser())
    });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/rag/query", "POST", {
        question: "Quel est le protocole ?"
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Query mock failure" });
  });

  it("indexes a document with mocked vectorization and storage", async () => {
    const createDocument = mock(async (document: DocumentRecord) => document);
    const store = createStoreStub({ createDocument });
    const app = createApp({
      store,
      getAuthenticatedUser: createAuthenticatedUser(createPatientUser())
    });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/documents", "POST", {
        title: "Guide patient",
        group: "patients",
        sourceText: "Contenu indexe"
      })
    );

    expect(response.status).toBe(201);
    expect(mockedIndexDocumentInPinecone).toHaveBeenCalledTimes(1);
    expect(createDocument).toHaveBeenCalledTimes(1);
    expect(await response.json()).toMatchObject({
      document: {
        title: "Guide patient",
        group: "patients",
        chunkCount: 2,
        createdBy: "patient@example.com"
      }
    });
  });

  it("uploads text files through FormData with mocked indexing", async () => {
    const createDocument = mock(async (document: DocumentRecord) => document);
    const store = createStoreStub({ createDocument });
    const app = createApp({
      store,
      getAuthenticatedUser: createAuthenticatedUser(createPatientUser())
    });
    const formData = new FormData();
    formData.append("group", "patients");
    formData.append(
      "files",
      new File(["Contenu upload 1"], "guide-1.md", { type: "text/markdown" })
    );
    formData.append(
      "files",
      new File(["Contenu upload 2"], "guide-2.txt", { type: "text/plain" })
    );

    const response = await app.handle(
      new Request("http://localhost/api/documents/upload", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(201);
    expect(mockedIndexDocumentInPinecone).toHaveBeenCalledTimes(2);
    expect(createDocument).toHaveBeenCalledTimes(2);
    expect(await response.json()).toMatchObject({
      documents: [
        { title: "guide-1", group: "patients", chunkCount: 2 },
        { title: "guide-2", group: "patients", chunkCount: 2 }
      ]
    });
  });

  it("rejects upload when a file extension is not allowed", async () => {
    const app = createApp({
      store: createStoreStub(),
      getAuthenticatedUser: createAuthenticatedUser(createPatientUser())
    });
    const formData = new FormData();
    formData.append("group", "patients");
    formData.append(
      "files",
      new File(["Contenu binaire"], "guide.pdf", {
        type: "application/pdf"
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/documents/upload", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Seuls les fichiers texte, markdown et md sont acceptes."
    });
  });

  it("deletes a document with mocked vector deletion", async () => {
    const deleteDocument = mock(async () => {});
    const store = createStoreStub({ deleteDocument });
    const app = createApp({
      store,
      getAuthenticatedUser: createAuthenticatedUser(createPatientUser())
    });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/documents/doc-1", "DELETE")
    );

    expect(response.status).toBe(200);
    expect(mockedDeleteDocumentVectors).toHaveBeenCalledTimes(1);
    expect(deleteDocument).toHaveBeenCalledWith("doc-1");
    expect(await response.json()).toEqual({ ok: true });
  });
});
