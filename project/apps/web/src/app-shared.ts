import { useOutletContext } from "react-router-dom";
import type { ChunkMode, DashboardContextValue } from "./app-types";

export const CHUNK_MODE_OPTIONS: Array<{ value: ChunkMode; label: string }> = [
  { value: "characters", label: "Caractères" },
  { value: "words", label: "Mots" },
  { value: "tokens", label: "Tokens" }
];

export const getChunkModeLabel = (chunkMode: ChunkMode) =>
  CHUNK_MODE_OPTIONS.find((option) => option.value === chunkMode)?.label ||
  "Caractères";

export const getChunkUnitLabel = (chunkMode: ChunkMode) => {
  switch (chunkMode) {
    case "words":
      return "mots";
    case "tokens":
      return "tokens";
    default:
      return "caractères";
  }
};

export const sampleDocument = `Le Retrieval-Augmented Generation, ou RAG, combine une phase de recherche documentaire et une phase de génération assistée par contexte. Les documents sont découpés en morceaux, vectorisés, puis stockés dans une base adaptée à la recherche sémantique.

Dans cette démonstration, chaque document appartient à un groupe. Le filtrage d'accès doit donc s'appliquer avant même l'étape de génération : on ne doit jamais injecter dans le prompt un chunk provenant d'un groupe auquel l'utilisateur n'appartient pas.

Un bon chunking améliore le rappel et la précision. Si les fragments sont trop petits, le contexte devient pauvre. S'ils sont trop longs, la récupération renvoie des passages moins ciblés.`;

export const ACCEPTED_DOCUMENT_EXTENSIONS = [".txt", ".md", ".markdown"];
export const ACCEPTED_DOCUMENT_INPUT =
  ".txt,.md,.markdown,text/plain,text/markdown";

export const isAcceptedDocumentFile = (file: File) =>
  ACCEPTED_DOCUMENT_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );

export const getDocumentTitleFromFileName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "") || fileName;

export const buildDocumentFileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;

export const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} o`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} Ko`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;
  return configuredUrl ? configuredUrl.replace(/\/$/, "") : "";
};

const API_BASE_URL = getApiBaseUrl();

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const apiRequest = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers
    }
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as Record<string, unknown>)
    : null;

  if (!response.ok) {
    throw new ApiError(
      String(payload?.error || "La requête a échoué."),
      response.status
    );
  }

  return payload as T;
};

export const useDashboardContext = () =>
  useOutletContext<DashboardContextValue>();
