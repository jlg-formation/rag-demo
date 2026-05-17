import {
  FaCircleCheck,
  FaClock,
  FaDatabase,
  FaShieldHalved
} from "react-icons/fa6";
import {
  formatDateTime,
  getChunkModeLabel,
  getChunkUnitLabel
} from "../../app-shared";
import type { RagConfigSummary } from "../../app-types";
import { Card } from "../../components/ui";

export function RagConfigurationStatusCards({
  ragConfig
}: {
  ragConfig: RagConfigSummary;
}) {
  return (
    <div className="status-grid">
      <Card className="info-card">
        <p className="answer-label info-line">
          <FaCircleCheck />
          <span>État</span>
        </p>
        <p>{ragConfig.configured ? "Configuré" : "Non configuré"}</p>
        <p className="muted-text meta-line">
          <FaShieldHalved />
          <span>Namespace : {ragConfig.namespace || "rag-demo"}</span>
        </p>
      </Card>
      <Card className="info-card">
        <p className="answer-label info-line">
          <FaDatabase />
          <span>Index Pinecone</span>
        </p>
        <p>{ragConfig.pineconeIndex || "-"}</p>
        <p className="muted-text meta-line">
          <FaClock />
          <span>Mis à jour : {formatDateTime(ragConfig.updatedAt)}</span>
        </p>
      </Card>
      <Card className="info-card">
        <p className="answer-label info-line">
          <FaDatabase />
          <span>Chunking</span>
        </p>
        <p>
          {getChunkModeLabel(ragConfig.chunkMode)} · {ragConfig.chunkSize}{" "}
          {getChunkUnitLabel(ragConfig.chunkMode)}, overlap{" "}
          {ragConfig.chunkOverlap} {getChunkUnitLabel(ragConfig.chunkMode)}
        </p>
        <p className="muted-text meta-line">
          <FaClock />
          <span>
            Stride : {ragConfig.chunkStride}{" "}
            {getChunkUnitLabel(ragConfig.chunkMode)}
          </span>
        </p>
      </Card>
    </div>
  );
}
