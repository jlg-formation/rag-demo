import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest, useDashboardContext } from "../../app-shared";
import type { QueryResponse, QuestionCase } from "../../app-types";
import { RAG_QUESTION_SETS } from "../../rag-question-sets";

export function useRagQuestionFlow() {
  const { user, ragConfig, resetAuth } = useDashboardContext();
  const trainingSet = useMemo(
    () =>
      RAG_QUESTION_SETS.find(
        (questionSet) => questionSet.purpose === "training"
      ) || null,
    []
  );
  const benchmarkSet = useMemo(
    () =>
      RAG_QUESTION_SETS.find(
        (questionSet) => questionSet.purpose === "benchmark"
      ) || null,
    []
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [question, setQuestion] = useState("");
  const [selectedBenchmarkCaseId, setSelectedBenchmarkCaseId] = useState("");
  const [evaluatedBenchmarkCaseId, setEvaluatedBenchmarkCaseId] = useState<
    string | null
  >(null);

  const isCaseAccessible = (questionCase: QuestionCase) =>
    questionCase.allowedGroups.some((group) => user.groups.includes(group));

  const starterQuestions = useMemo(
    () => (trainingSet?.cases || []).filter(isCaseAccessible).slice(0, 6),
    [trainingSet, user]
  );
  const accessibleBenchmarkCases = useMemo(
    () => (benchmarkSet?.cases || []).filter(isCaseAccessible),
    [benchmarkSet, user]
  );
  const selectedBenchmarkCase = useMemo(
    () =>
      accessibleBenchmarkCases.find(
        (questionCase) => questionCase.id === selectedBenchmarkCaseId
      ) ||
      accessibleBenchmarkCases[0] ||
      null,
    [accessibleBenchmarkCases, selectedBenchmarkCaseId]
  );
  const evaluatedBenchmarkCase = useMemo(
    () =>
      accessibleBenchmarkCases.find(
        (questionCase) => questionCase.id === evaluatedBenchmarkCaseId
      ) || null,
    [accessibleBenchmarkCases, evaluatedBenchmarkCaseId]
  );

  useEffect(() => {
    const firstCaseId = accessibleBenchmarkCases[0]?.id || "";
    setSelectedBenchmarkCaseId((current) => {
      if (!accessibleBenchmarkCases.length) {
        return "";
      }

      return accessibleBenchmarkCases.some(
        (questionCase) => questionCase.id === current
      )
        ? current
        : firstCaseId;
    });
  }, [accessibleBenchmarkCases]);

  useEffect(() => {
    if (
      evaluatedBenchmarkCaseId &&
      !accessibleBenchmarkCases.some(
        (questionCase) => questionCase.id === evaluatedBenchmarkCaseId
      )
    ) {
      setEvaluatedBenchmarkCaseId(null);
    }
  }, [accessibleBenchmarkCases, evaluatedBenchmarkCaseId]);

  const handleUnauthorized = (nextError: unknown) => {
    if (nextError instanceof ApiError && nextError.status === 401) {
      resetAuth();
    }
  };

  const runQuery = async (questionText: string) => {
    const normalizedQuestion = questionText.trim();

    if (!normalizedQuestion) {
      setError("La question est obligatoire.");
      return;
    }

    setIsQuerying(true);
    setError(null);

    try {
      const payload = await apiRequest<QueryResponse>("/api/rag/query", {
        method: "POST",
        body: JSON.stringify({ question: normalizedQuestion })
      });
      setQuestion(normalizedQuestion);
      setResult(payload);
    } catch (nextError) {
      handleUnauthorized(nextError);
      setError(
        nextError instanceof Error ? nextError.message : "Requête impossible."
      );
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEvaluatedBenchmarkCaseId(null);
    await runQuery(question);
  };

  return {
    accessibleBenchmarkCases,
    evaluatedBenchmarkCase,
    error,
    handleQuery,
    isQuerying,
    question,
    questionIsEmpty: !question.trim(),
    ragConfig,
    result,
    runQuery,
    selectedBenchmarkCase,
    setEvaluatedBenchmarkCaseId,
    setQuestion,
    setSelectedBenchmarkCaseId,
    shouldShowAnswerCard: isQuerying || Boolean(result?.answer?.trim()),
    starterQuestions,
    trainingSet
  };
}
