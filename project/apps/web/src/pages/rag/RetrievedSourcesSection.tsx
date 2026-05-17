import { FaFileLines, FaMagnifyingGlass } from "react-icons/fa6";
import type { RetrievedChunk } from "../../app-types";
import { EmptyState } from "../../components/ui";
import { RetrievedChunkAccordion } from "./RetrievedChunkAccordion";

export function RetrievedSourcesSection({
  chunks
}: {
  chunks: RetrievedChunk[];
}) {
  return (
    <div className="retrieval-section">
      <div className="retrieval-section__header">
        <div className="flex flex-col gap-1">
          <p className="answer-label info-line">
            <FaFileLines />
            <span>Sources (Passages récupérés)</span>
          </p>
          <p className="m-0 text-sm text-ink-700">
            Les métadonnées restent visibles. Le contenu détaillé est replié par
            défaut pour préserver la lecture de la réponse.
          </p>
        </div>
        {chunks.length ? (
          <span className="status-chip">
            <FaMagnifyingGlass />
            <span>{chunks.length} chunk(s)</span>
          </span>
        ) : null}
      </div>

      <div className="retrieval-list">
        {chunks.map((chunk) => (
          <RetrievedChunkAccordion
            chunk={chunk}
            key={`${chunk.documentId}-${chunk.id}`}
          />
        ))}

        {!chunks.length ? (
          <EmptyState icon={<FaMagnifyingGlass />}>
            Les passages récupérés apparaîtront ici après la première question.
          </EmptyState>
        ) : null}
      </div>
    </div>
  );
}
