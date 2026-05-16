import { describe, expect, it } from "bun:test";
import { chunkDocument, DEFAULT_CHUNK_MODE, getChunkingConfig } from "./rag";

describe("getChunkingConfig", () => {
  it("uses characters as the default chunk mode", () => {
    expect(getChunkingConfig({}).chunkMode).toBe(DEFAULT_CHUNK_MODE);
  });
});

describe("chunkDocument", () => {
  it("keeps the historical behavior for characters", () => {
    expect(
      chunkDocument("abcdefghij", {
        chunkMode: "characters",
        chunkSize: 4,
        chunkOverlap: 1
      })
    ).toEqual(["abcd", "defg", "ghij"]);
  });

  it("splits by words with overlap", () => {
    expect(
      chunkDocument("un deux trois quatre cinq six", {
        chunkMode: "words",
        chunkSize: 3,
        chunkOverlap: 1
      })
    ).toEqual(["un deux trois", "trois quatre cinq", "cinq six"]);
  });

  it("splits by tokens with js-tiktoken", () => {
    const chunks = chunkDocument("Bonjour le monde, ceci est un test.", {
      chunkMode: "tokens",
      chunkSize: 4,
      chunkOverlap: 1
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
  });

  it("returns no chunk for an empty document", () => {
    expect(
      chunkDocument("   ", {
        chunkMode: "words",
        chunkSize: 3,
        chunkOverlap: 1
      })
    ).toEqual([]);
  });
});
