import { FaClock, FaGear, FaWandSparkles } from "react-icons/fa6";
import { Card } from "../../components/ui";
import { MarkdownAnswer } from "./MarkdownAnswer";

type RagAnswerCardProps = {
  answer: string;
  isQuerying: boolean;
};

export function RagAnswerCard({ answer, isQuerying }: RagAnswerCardProps) {
  return (
    <Card className="answer-card">
      <div className="answer-card__header">
        <div className="flex flex-col gap-2">
          <p className="answer-label info-line">
            <FaWandSparkles />
            <span>Réponse</span>
          </p>
          <p className="m-0 text-sm text-ink-700">
            La synthèse affichée ici s'appuie sur les documents autorisés pour
            votre compte.
          </p>
        </div>

        <span
          className={`status-chip ${isQuerying ? "is-working" : "is-ready"}`}
        >
          {isQuerying ? (
            <FaGear className="answer-card__spinner" />
          ) : (
            <FaClock />
          )}
          <span>{isQuerying ? "Traitement backend" : "Réponse reçue"}</span>
        </span>
      </div>

      <div className="answer-card__body">
        {isQuerying ? (
          <div className="answer-card__loading-state">
            <span className="answer-card__loading-icon" aria-hidden="true">
              <FaGear className="answer-card__spinner" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="m-0 font-semibold text-ink-900">
                Interrogation en cours…
              </p>
              <p className="m-0 text-sm text-ink-700">
                Le backend recherche les passages pertinents puis compose la
                réponse.
              </p>
            </div>
          </div>
        ) : (
          <MarkdownAnswer content={answer} />
        )}
      </div>
    </Card>
  );
}
