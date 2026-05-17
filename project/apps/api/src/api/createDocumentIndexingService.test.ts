import { describe, expect, it, mock } from "bun:test";
import type { DataStore } from "../store";
import type { RagSettingsRecord, UserRecord } from "../types";
import {
  createIndexDocumentForUser,
  getFileExtension,
  normalizeDocumentTitle
} from "./createDocumentIndexingService";

const mockedIndexDocumentInPinecone = mock(async () => ({
  chunkCount: 2,
  vectorIds: ["vec-1", "vec-2"]
}));

mock.module("../rag", () => ({
  DEFAULT_CHUNK_MODE: "characters",
  DEFAULT_CHUNK_OVERLAP: 200,
  DEFAULT_CHUNK_SIZE: 1000,
  getChunkingConfig: ({ chunkMode, chunkSize, chunkOverlap }: any) => ({
    chunkMode: chunkMode ?? "characters",
    chunkSize: chunkSize ?? 1000,
    chunkOverlap: chunkOverlap ?? 200,
    chunkStride: (chunkSize ?? 1000) - (chunkOverlap ?? 200)
  }),
  indexDocumentInPinecone: mockedIndexDocumentInPinecone,
  isChunkMode: (value: string) =>
    value === "characters" || value === "words" || value === "tokens"
}));

const createUser = (): UserRecord => ({
  email: "alice@example.com",
  passwordHash: "hash",
  displayName: "Alice",
  groups: ["patients"],
  createdAt: "2026-01-01T00:00:00.000Z"
});

const createRagSettings = (): RagSettingsRecord => ({
  openAiApiKey: "openai-key",
  pineconeApiKey: "pinecone-key",
  pineconeIndex: "demo-index",
  pineconeHost: "demo-host",
  embeddingModel: "text-embedding-3-small",
  chatModel: "gpt-4.1-mini",
  chunkMode: "characters",
  chunkSize: 500,
  chunkOverlap: 50,
  namespace: "rag-demo",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "admin@example.com"
});

const createStoreStub = (overrides?: Partial<Record<string, unknown>>) => {
  return {
    hasGroup: mock(() => true),
    getRagSettings: mock(() => createRagSettings()),
    createDocument: mock(async (document) => document),
    ...overrides
  } as unknown as DataStore;
};

describe("createDocumentIndexingService helpers", () => {
  it("extracts the lowercased file extension", () => {
    expect(getFileExtension("Guide.MD")).toBe(".md");
  });

  it("normalizes a document title from the filename", () => {
    expect(normalizeDocumentTitle("  guide-utilisateur.md  ")).toBe(
      "guide-utilisateur"
    );
  });
});

describe("createIndexDocumentForUser", () => {
  it("rejects missing title, group or source text", async () => {
    const store = createStoreStub();
    const indexDocumentForUser = createIndexDocumentForUser(store);
    const set = {};

    const result = await indexDocumentForUser({
      title: " ",
      group: "patients",
      sourceText: "contenu",
      user: createUser(),
      set
    });

    expect(result).toEqual({
      error: "Titre, groupe et contenu du document sont obligatoires."
    });
    expect(set).toEqual({ status: 400 });
  });

  it("rejects an unknown group", async () => {
    const store = createStoreStub({ hasGroup: mock(() => false) });
    const indexDocumentForUser = createIndexDocumentForUser(store);
    const set = {};

    const result = await indexDocumentForUser({
      title: "Guide",
      group: "unknown",
      sourceText: "contenu",
      user: createUser(),
      set
    });

    expect(result).toEqual({ error: "Le groupe indique n'existe pas." });
    expect(set).toEqual({ status: 404 });
  });

  it("rejects a user outside the target group", async () => {
    const store = createStoreStub();
    const indexDocumentForUser = createIndexDocumentForUser(store);
    const set = {};

    const result = await indexDocumentForUser({
      title: "Guide",
      group: "admin",
      sourceText: "contenu",
      user: createUser(),
      set
    });

    expect(result).toEqual({
      error:
        "Vous ne pouvez indexer un document que pour un groupe auquel vous appartenez."
    });
    expect(set).toEqual({ status: 403 });
  });

  it("rejects indexing when RAG is not configured", async () => {
    const store = createStoreStub({ getRagSettings: mock(() => null) });
    const indexDocumentForUser = createIndexDocumentForUser(store);
    const set = {};

    const result = await indexDocumentForUser({
      title: "Guide",
      group: "patients",
      sourceText: "contenu",
      user: createUser(),
      set
    });

    expect(result).toEqual({
      error: "Le backend RAG n'est pas encore configure."
    });
    expect(set).toEqual({ status: 409 });
  });

  it("creates the document when validation passes", async () => {
    const createDocument = mock(async (document) => document);
    const store = createStoreStub({ createDocument });
    const indexDocumentForUser = createIndexDocumentForUser(store);
    const set = {};

    const result = await indexDocumentForUser({
      title: "Guide",
      group: "patients",
      sourceText: "contenu",
      user: createUser(),
      set
    });

    expect("document" in result).toBe(true);
    expect(mockedIndexDocumentInPinecone).toHaveBeenCalledTimes(1);
    expect(createDocument).toHaveBeenCalledTimes(1);
    expect(set).toEqual({});
  });
});
