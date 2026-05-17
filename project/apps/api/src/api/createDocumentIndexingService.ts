import {
  DEFAULT_CHUNK_MODE,
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  getChunkingConfig,
  indexDocumentInPinecone,
  isChunkMode
} from "../rag";
import type { DataStore } from "../store";
import type { ChunkMode, UserRecord } from "../types";
import { toDocumentSummary } from "./apiMappers";
import {
  badRequest,
  forbidden,
  handleError,
  notFound,
  requireConfiguredRag
} from "./apiResponses";
import type { ResponseSet } from "./apiTypes";

export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown"
]);

export const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
};

export const normalizeDocumentTitle = (rawTitle: string) => {
  const title = rawTitle.trim();
  if (!title) {
    return "";
  }

  return title.replace(/\.[^.]+$/, "").trim() || title;
};

export const createIndexDocumentForUser = (store: DataStore) => {
  return async (input: {
    title: string;
    group: string;
    sourceText: string;
    chunkMode?: ChunkMode;
    chunkSize?: number;
    chunkOverlap?: number;
    user: UserRecord;
    set: ResponseSet;
  }) => {
    const title = input.title.trim();
    const group = input.group.trim();
    const sourceText = input.sourceText.trim();

    if (!title || !group || !sourceText) {
      return badRequest(
        input.set,
        "Titre, groupe et contenu du document sont obligatoires."
      );
    }

    if (!store.hasGroup(group)) {
      return notFound(input.set, "Le groupe indique n'existe pas.");
    }

    if (!input.user.groups.includes(group)) {
      return forbidden(
        input.set,
        "Vous ne pouvez indexer un document que pour un groupe auquel vous appartenez."
      );
    }

    const ragSettings = requireConfiguredRag(store, input.set);
    if ("error" in ragSettings) {
      return ragSettings;
    }

    const resolvedChunkMode =
      input.chunkMode ?? ragSettings.chunkMode ?? DEFAULT_CHUNK_MODE;

    if (!isChunkMode(resolvedChunkMode)) {
      return badRequest(
        input.set,
        "Le mode de chunking doit etre characters, words ou tokens."
      );
    }

    const { chunkMode, chunkSize, chunkOverlap } = getChunkingConfig({
      chunkMode: resolvedChunkMode,
      chunkSize: input.chunkSize ?? ragSettings.chunkSize,
      chunkOverlap: input.chunkOverlap ?? ragSettings.chunkOverlap
    });

    if (chunkOverlap >= chunkSize) {
      return badRequest(
        input.set,
        "L'overlap doit rester strictement inferieur a la taille de chunk."
      );
    }

    try {
      const documentId = crypto.randomUUID();
      const indexed = await indexDocumentInPinecone(
        {
          ...ragSettings,
          chunkMode,
          chunkSize,
          chunkOverlap
        },
        {
          id: documentId,
          title,
          group,
          sourceText,
          createdBy: input.user.email
        }
      );

      const document = await store.createDocument({
        id: documentId,
        title,
        group,
        sourceText,
        chunkCount: indexed.chunkCount,
        chunkMode,
        chunkSize,
        chunkOverlap,
        vectorIds: indexed.vectorIds,
        createdAt: new Date().toISOString(),
        createdBy: input.user.email
      });

      return { document: toDocumentSummary(document) };
    } catch (error) {
      input.set.status = 500;
      return { error: handleError(error) };
    }
  };
};
