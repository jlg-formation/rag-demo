import type { IconType } from "react-icons";
import {
  FaFileLines,
  FaGear,
  FaLayerGroup,
  FaPlus,
  FaUsers,
  FaWandSparkles
} from "react-icons/fa6";
import type { RagConfigSummary } from "./app-types";

export const EMPTY_RAG_CONFIG: RagConfigSummary = {
  configured: false,
  openAiApiKeyConfigured: false,
  openAiApiKeyLast4: null,
  pineconeApiKeyConfigured: false,
  pineconeApiKeyLast4: null,
  pineconeIndex: null,
  pineconeHost: null,
  embeddingModel: null,
  chatModel: null,
  updatedAt: null,
  updatedBy: null,
  namespace: null
};

export type NavigationItem = {
  to: string;
  label: string;
  icon: IconType;
};

export const getNavigationItems = (isAdmin: boolean): NavigationItem[] => [
  { to: "/app/rag", label: "Question RAG", icon: FaWandSparkles },
  ...(isAdmin
    ? [
        {
          to: "/app/rag/configuration",
          label: "Config RAG",
          icon: FaGear
        }
      ]
    : []),
  { to: "/app/documents", label: "Documents", icon: FaFileLines },
  { to: "/app/documents/indexer", label: "Indexer", icon: FaPlus },
  ...(isAdmin
    ? [
        { to: "/app/groups", label: "Groupes", icon: FaLayerGroup },
        { to: "/app/users", label: "Utilisateurs", icon: FaUsers }
      ]
    : [])
];
