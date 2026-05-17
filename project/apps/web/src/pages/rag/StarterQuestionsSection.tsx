import { FaLayerGroup, FaListCheck } from "react-icons/fa6";
import type { QuestionCase, QuestionSet } from "../../app-types";

type StarterQuestionsSectionProps = {
  disabled: boolean;
  onSelectQuestion: (question: string) => Promise<void>;
  questionSet: QuestionSet | null;
  starterQuestions: QuestionCase[];
};

export function StarterQuestionsSection({
  disabled,
  onSelectQuestion,
  questionSet,
  starterQuestions
}: StarterQuestionsSectionProps) {
  if (!starterQuestions.length) {
    return null;
  }

  return (
    <div className="suggested-questions">
      <div className="suggested-questions__header">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-semibold text-ink-900">
            Exemples de demarrage
          </p>
          <p className="m-0 text-sm text-ink-700">
            Raccourcis utiles pour lancer rapidement une premiere requete.
          </p>
        </div>
        {questionSet ? (
          <span className="status-chip">
            <FaListCheck />
            <span>{questionSet.title}</span>
          </span>
        ) : null}
      </div>

      <div className="suggested-questions__grid">
        {starterQuestions.map((questionCase) => (
          <button
            className="suggestion-card"
            disabled={disabled}
            key={questionCase.id}
            type="button"
            onClick={() => onSelectQuestion(questionCase.question)}
          >
            <span className="suggestion-card__title">{questionCase.title}</span>
            <span className="suggestion-card__question">
              {questionCase.question}
            </span>
            <span className="suggestion-card__meta">
              <FaLayerGroup />
              <span>{questionCase.allowedGroups.join(", ")}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
