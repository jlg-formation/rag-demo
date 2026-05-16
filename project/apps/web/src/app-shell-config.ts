import type { IconType } from "react-icons";
import {
  FaCode,
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
  chunkSize: 320,
  chunkOverlap: 40,
  chunkStride: 280,
  updatedAt: null,
  updatedBy: null,
  namespace: null
};

export type NavigationItem = {
  to: string;
  label: string;
  icon: IconType;
  section: string;
};

export const getNavigationItems = (isAdmin: boolean): NavigationItem[] => [
  {
    to: "/app/rag",
    label: "Question RAG",
    icon: FaWandSparkles,
    section: "RAG"
  },
  ...(isAdmin
    ? [
        {
          to: "/app/rag/configuration",
          label: "Config RAG",
          icon: FaGear,
          section: "RAG"
        }
      ]
    : []),
  {
    to: "/app/documents",
    label: "Documents",
    icon: FaFileLines,
    section: "Contenu"
  },
  {
    to: "/app/documents/indexer",
    label: "Indexer",
    icon: FaPlus,
    section: "Contenu"
  },
  {
    to: "/app/unit-demos/tiktoken",
    label: "Tiktoken",
    icon: FaCode,
    section: "Démo unitaire"
  },
  ...(isAdmin
    ? [
        {
          to: "/app/groups",
          label: "Groupes",
          icon: FaLayerGroup,
          section: "Administration"
        },
        {
          to: "/app/users",
          label: "Utilisateurs",
          icon: FaUsers,
          section: "Administration"
        }
      ]
    : [])
];
