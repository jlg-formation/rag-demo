import { FaFileLines, FaLayerGroup, FaMagnifyingGlass } from "react-icons/fa6";
import type { RetrievedChunk } from "../../app-types";
import { Card } from "../../components/ui";

export function RetrievedChunkAccordion({ chunk }: { chunk: RetrievedChunk }) {
  return (
    <Card as="details" className="retrieval-card retrieval-disclosure">
      <summary
        aria-label="Afficher le passage source"
        className="retrieval-disclosure__summary"
      >
        <div className="retrieval-disclosure__header">
          <div className="retrieval-meta">
            <span className="meta-line">
              <FaFileLines />
              <span>{chunk.title}</span>
            </span>
            <span className="meta-line">
              <FaMagnifyingGlass />
              <span>
                Source {chunk.id} · Score {chunk.score}
              </span>
            </span>
          </div>
          <p className="muted-text meta-line">
            <FaLayerGroup />
            <span>Groupe : {chunk.group}</span>
          </p>
        </div>
      </summary>
      <div className="retrieval-disclosure__body">
        <p>{chunk.content}</p>
      </div>
    </Card>
  );
}
