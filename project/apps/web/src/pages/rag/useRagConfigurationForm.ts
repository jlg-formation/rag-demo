import { type FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../app-shared";
import type { ChunkMode, RagConfigSummary } from "../../app-types";

const DEFAULT_CHUNK_MODE: ChunkMode = "characters";
const DEFAULT_CHUNK_SIZE = 320;
const DEFAULT_CHUNK_OVERLAP = 40;

type UseRagConfigurationFormOptions = {
  ragConfig: RagConfigSummary;
  resetAuth: () => void;
  setRagConfig: (value: RagConfigSummary) => void;
};

export function useRagConfigurationForm({
  ragConfig,
  resetAuth,
  setRagConfig
}: UseRagConfigurationFormOptions) {
  const [showOpenAiApiKey, setShowOpenAiApiKey] = useState(false);
  const [showPineconeApiKey, setShowPineconeApiKey] = useState(false);
  const [replaceOpenAiApiKey, setReplaceOpenAiApiKey] = useState(false);
  const [replacePineconeApiKey, setReplacePineconeApiKey] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [pineconeApiKey, setPineconeApiKey] = useState("");
  const [pineconeIndex, setPineconeIndex] = useState(
    ragConfig.pineconeIndex || ""
  );
  const [pineconeHost, setPineconeHost] = useState(
    ragConfig.pineconeHost || ""
  );
  const [embeddingModel, setEmbeddingModel] = useState(
    ragConfig.embeddingModel || "text-embedding-3-small"
  );
  const [chatModel, setChatModel] = useState(
    ragConfig.chatModel || "gpt-4.1-mini"
  );
  const [chunkMode, setChunkMode] = useState<ChunkMode>(
    ragConfig.chunkMode || DEFAULT_CHUNK_MODE
  );
  const [chunkSize, setChunkSize] = useState(
    String(ragConfig.chunkSize || 320)
  );
  const [chunkOverlap, setChunkOverlap] = useState(
    String(ragConfig.chunkOverlap || 40)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const chunkSizeValue = Math.max(1, Number(chunkSize) || DEFAULT_CHUNK_SIZE);
  const chunkOverlapValue = Math.max(
    0,
    Number(chunkOverlap) || DEFAULT_CHUNK_OVERLAP
  );
  const chunkStrideValue = chunkSizeValue - chunkOverlapValue;

  useEffect(() => {
    setOpenAiApiKey("");
    setPineconeApiKey("");
    setReplaceOpenAiApiKey(false);
    setReplacePineconeApiKey(false);
    setShowOpenAiApiKey(false);
    setShowPineconeApiKey(false);
    setPineconeIndex(ragConfig.pineconeIndex || "");
    setPineconeHost(ragConfig.pineconeHost || "");
    setEmbeddingModel(ragConfig.embeddingModel || "text-embedding-3-small");
    setChatModel(ragConfig.chatModel || "gpt-4.1-mini");
    setChunkMode(ragConfig.chunkMode || DEFAULT_CHUNK_MODE);
    setChunkSize(String(ragConfig.chunkSize || DEFAULT_CHUNK_SIZE));
    setChunkOverlap(String(ragConfig.chunkOverlap || DEFAULT_CHUNK_OVERLAP));
  }, [ragConfig]);

  const handleUnauthorized = (nextError: unknown) => {
    if (nextError instanceof ApiError && nextError.status === 401) {
      resetAuth();
    }
  };

  const handleConfigure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsConfiguring(true);
    setError(null);
    setMessage(null);

    try {
      if (chunkOverlapValue >= chunkSizeValue) {
        throw new Error(
          "L'overlap doit rester strictement inférieur à la taille de chunk."
        );
      }

      const requestBody: {
        openAiApiKey?: string;
        pineconeApiKey?: string;
        pineconeIndex: string;
        pineconeHost?: string;
        embeddingModel: string;
        chatModel: string;
        chunkMode: ChunkMode;
        chunkSize: number;
        chunkOverlap: number;
      } = {
        pineconeIndex,
        pineconeHost: pineconeHost || undefined,
        embeddingModel,
        chatModel,
        chunkMode,
        chunkSize: chunkSizeValue,
        chunkOverlap: chunkOverlapValue
      };

      if (replaceOpenAiApiKey) {
        requestBody.openAiApiKey = openAiApiKey;
      }

      if (replacePineconeApiKey) {
        requestBody.pineconeApiKey = pineconeApiKey;
      }

      const payload = await apiRequest<{ ragConfig: RagConfigSummary }>(
        "/api/rag/configure",
        {
          method: "POST",
          body: JSON.stringify(requestBody)
        }
      );
      setRagConfig(payload.ragConfig);
      setMessage("Configuration RAG mise à jour côté backend.");
    } catch (nextError) {
      handleUnauthorized(nextError);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Configuration impossible."
      );
    } finally {
      setIsConfiguring(false);
    }
  };

  return {
    chatModel,
    chunkMode,
    chunkOverlap,
    chunkOverlapValue,
    chunkSize,
    chunkSizeValue,
    chunkStrideValue,
    embeddingModel,
    error,
    handleConfigure,
    isConfiguring,
    message,
    openAiApiKey,
    pineconeApiKey,
    pineconeHost,
    pineconeIndex,
    replaceOpenAiApiKey,
    replacePineconeApiKey,
    setChatModel,
    setChunkMode,
    setChunkOverlap,
    setChunkSize,
    setEmbeddingModel,
    setOpenAiApiKey,
    setPineconeApiKey,
    setPineconeHost,
    setPineconeIndex,
    setReplaceOpenAiApiKey,
    setReplacePineconeApiKey,
    setShowOpenAiApiKey,
    setShowPineconeApiKey,
    showOpenAiApiKey,
    showPineconeApiKey
  };
}
