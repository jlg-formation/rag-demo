import benchmarkSet from "../../../../benchmarks/benchmark-v1.json";
import trainingSet from "../../../../benchmarks/stagiaires-v1.json";
import type { QuestionSet } from "./app-types";

export const RAG_QUESTION_SETS: QuestionSet[] = [
  trainingSet as QuestionSet,
  benchmarkSet as QuestionSet
];

export const getQuestionSetLabel = (questionSet: QuestionSet) =>
  questionSet.purpose === "benchmark"
    ? `${questionSet.title} · benchmark`
    : `${questionSet.title} · guide`;
