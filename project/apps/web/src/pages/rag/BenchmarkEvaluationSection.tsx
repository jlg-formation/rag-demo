import { FaCircleCheck, FaListCheck, FaWandSparkles } from "react-icons/fa6";
import type { QuestionCase } from "../../app-types";
import { Button, Card, Field, SelectInput } from "../../components/ui";

type BenchmarkEvaluationSectionProps = {
  benchmarkCases: QuestionCase[];
  disabled: boolean;
  evaluatedBenchmarkCase: QuestionCase | null;
  selectedBenchmarkCase: QuestionCase | null;
  setSelectedBenchmarkCaseId: (value: string) => void;
  onRunBenchmark: () => Promise<void>;
};

export function BenchmarkEvaluationSection({
  benchmarkCases,
  disabled,
  evaluatedBenchmarkCase,
  selectedBenchmarkCase,
  setSelectedBenchmarkCaseId,
  onRunBenchmark
}: BenchmarkEvaluationSectionProps) {
  if (!benchmarkCases.length) {
    return null;
  }

  return (
    <details className="benchmark-disclosure">
      <summary className="benchmark-disclosure__summary">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-semibold text-ink-900">
            Benchmark et evaluation
          </p>
          <p className="m-0 text-sm text-ink-700">
            Outil secondaire pour comparer une reponse a un cas de reference.
          </p>
        </div>
        <span className="status-chip is-neutral">
          <FaListCheck />
          <span>Secondaire</span>
        </span>
      </summary>

      <div className="benchmark-disclosure__body">
        <div className="benchmark-toolbar">
          <Field label="Cas de benchmark">
            <SelectInput
              value={selectedBenchmarkCase?.id || ""}
              onChange={(event) =>
                setSelectedBenchmarkCaseId(event.target.value)
              }
            >
              {benchmarkCases.map((questionCase) => (
                <option key={questionCase.id} value={questionCase.id}>
                  {questionCase.title}
                </option>
              ))}
            </SelectInput>
          </Field>

          <div className="benchmark-toolbar__actions">
            <Button
              disabled={disabled || !selectedBenchmarkCase}
              type="button"
              variant="secondary"
              onClick={onRunBenchmark}
            >
              <FaWandSparkles />
              <span>Lancer ce benchmark</span>
            </Button>
          </div>
        </div>

        {selectedBenchmarkCase ? (
          <Card className="compact-card benchmark-card">
            <p className="m-0 text-sm font-semibold text-ink-900">
              {selectedBenchmarkCase.question}
            </p>
            <p className="m-0 text-sm text-ink-700">
              {selectedBenchmarkCase.notes}
            </p>
          </Card>
        ) : null}

        {evaluatedBenchmarkCase ? (
          <Card className="compact-card benchmark-card">
            <p className="answer-label info-line">
              <FaCircleCheck />
              <span>Cadre d'evaluation</span>
            </p>
            <p className="m-0 text-sm text-ink-700">
              Dernier cas lance : {evaluatedBenchmarkCase.title}
            </p>

            <div className="benchmark-grid">
              <div>
                <p className="benchmark-card__label">Documents attendus</p>
                <ul className="benchmark-list">
                  {evaluatedBenchmarkCase.expectedDocuments.map((document) => (
                    <li key={document}>{document}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="benchmark-card__label">Doit idealement couvrir</p>
                <ul className="benchmark-list">
                  {evaluatedBenchmarkCase.mustInclude.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="benchmark-card__label">Doit eviter</p>
                <ul className="benchmark-list">
                  {evaluatedBenchmarkCase.mustAvoid.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </details>
  );
}
