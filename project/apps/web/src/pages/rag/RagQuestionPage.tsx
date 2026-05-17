import {
  FaMagnifyingGlass,
  FaShieldHalved,
  FaTriangleExclamation,
  FaWandSparkles
} from "react-icons/fa6";
import {
  Banner,
  Button,
  Divider,
  Field,
  Panel,
  PanelHeading,
  TextArea
} from "../../components/ui";
import { BenchmarkEvaluationSection } from "./BenchmarkEvaluationSection";
import { RagAnswerCard } from "./RagAnswerCard";
import { RetrievedSourcesSection } from "./RetrievedSourcesSection";
import { StarterQuestionsSection } from "./StarterQuestionsSection";
import { useRagQuestionFlow } from "./useRagQuestionFlow";

export function RagQuestionPage() {
  const flow = useRagQuestionFlow();

  return (
    <div className="page-grid">
      {!flow.ragConfig.configured ? (
        <Banner icon={<FaShieldHalved />} tone="info">
          Le backend RAG doit être configuré avant toute interrogation.
        </Banner>
      ) : null}
      {flow.error ? (
        <Banner icon={<FaTriangleExclamation />} tone="error">
          {flow.error}
        </Banner>
      ) : null}

      <Panel className="page-panel">
        <PanelHeading
          description={
            <>
              La recherche s’effectue uniquement sur les documents dont le
              groupe est autorisé pour l’utilisateur connecté.
            </>
          }
          icon={<FaMagnifyingGlass />}
          title="Question RAG"
        />

        <Divider className="my-5" />

        <div className="question-composer-card">
          <div className="question-composer-card__header">
            <div className="flex flex-col gap-2">
              <p className="answer-label info-line">
                <FaWandSparkles />
                <span>Posez une question</span>
              </p>
              <p className="m-0 text-sm text-ink-700">
                Saisissez votre demande ou partez d'un exemple. La réponse ne
                s'appuiera que sur les documents autorisés pour votre compte.
              </p>
            </div>
            <span className="status-chip is-ready">
              <FaShieldHalved />
              <span>Accès filtré par groupe</span>
            </span>
          </div>

          <form className="question-composer-form" onSubmit={flow.handleQuery}>
            <Field label="Votre question">
              <TextArea
                placeholder="Ex. Quels éléments du corpus décrivent le parcours d'admission d'un patient ?"
                rows={4}
                value={flow.question}
                onChange={(event) => flow.setQuestion(event.target.value)}
              />
            </Field>

            <div className="question-composer-card__actions">
              <Button
                disabled={
                  flow.isQuerying ||
                  !flow.ragConfig.configured ||
                  flow.questionIsEmpty
                }
                type="submit"
              >
                <FaWandSparkles />
                <span>{flow.isQuerying ? "Interrogation…" : "Interroger"}</span>
              </Button>
              <p className="muted-text meta-line m-0">
                <FaMagnifyingGlass />
                <span>
                  Les passages les plus pertinents apparaissent sous la réponse.
                </span>
              </p>
            </div>
          </form>

          <StarterQuestionsSection
            disabled={!flow.ragConfig.configured || flow.isQuerying}
            onSelectQuestion={async (nextQuestion) => {
              flow.setEvaluatedBenchmarkCaseId(null);
              await flow.runQuery(nextQuestion);
            }}
            questionSet={flow.trainingSet}
            starterQuestions={flow.starterQuestions}
          />

          <BenchmarkEvaluationSection
            benchmarkCases={flow.accessibleBenchmarkCases}
            disabled={!flow.ragConfig.configured || flow.isQuerying}
            evaluatedBenchmarkCase={flow.evaluatedBenchmarkCase}
            selectedBenchmarkCase={flow.selectedBenchmarkCase}
            setSelectedBenchmarkCaseId={flow.setSelectedBenchmarkCaseId}
            onRunBenchmark={async () => {
              if (!flow.selectedBenchmarkCase) {
                return;
              }

              flow.setEvaluatedBenchmarkCaseId(flow.selectedBenchmarkCase.id);
              await flow.runQuery(flow.selectedBenchmarkCase.question);
            }}
          />
        </div>

        {flow.shouldShowAnswerCard ? (
          <RagAnswerCard
            answer={flow.result?.answer || ""}
            isQuerying={flow.isQuerying}
          />
        ) : null}

        <RetrievedSourcesSection chunks={flow.result?.retrievedChunks || []} />
      </Panel>
    </div>
  );
}
