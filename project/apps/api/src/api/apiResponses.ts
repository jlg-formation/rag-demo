import type { DataStore } from "../store";
import type { RagSettingsRecord } from "../types";
import type { ResponseSet } from "./apiTypes";

export const handleError = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Une erreur inattendue est survenue.";

export const isPineconeMissingResourceError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    /pinecone/i.test(error.message) &&
    /HTTP status 404|returned 404|status 404|not found/i.test(error.message)
  );
};

export const unauthorized = (
  set: ResponseSet,
  message = "Authentification requise."
) => {
  set.status = 401;
  return { error: message };
};

export const forbidden = (set: ResponseSet, message = "Acces interdit.") => {
  set.status = 403;
  return { error: message };
};

export const notFound = (set: ResponseSet, message: string) => {
  set.status = 404;
  return { error: message };
};

export const badRequest = (set: ResponseSet, message: string) => {
  set.status = 400;
  return { error: message };
};

export const conflict = (set: ResponseSet, message: string) => {
  set.status = 409;
  return { error: message };
};

export const requireConfiguredRag = (
  store: DataStore,
  set: ResponseSet
): RagSettingsRecord | { error: string } => {
  const settings = store.getRagSettings();
  if (!settings) {
    set.status = 409;
    return { error: "Le backend RAG n'est pas encore configure." };
  }

  return settings;
};
