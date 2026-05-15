import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";

type ChunkScore = {
  content: string;
  score: number;
};

const STOP_WORDS = new Set([
  "a",
  "ai",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "dans",
  "de",
  "des",
  "du",
  "elle",
  "en",
  "et",
  "est",
  "il",
  "je",
  "la",
  "le",
  "les",
  "leur",
  "mais",
  "mes",
  "ne",
  "nos",
  "notre",
  "nous",
  "ou",
  "par",
  "pas",
  "pour",
  "que",
  "qui",
  "sa",
  "se",
  "ses",
  "son",
  "sur",
  "tes",
  "toi",
  "ton",
  "tu",
  "un",
  "une",
  "vos",
  "votre",
  "vous"
]);

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const chunkDocument = (document: string, maxChunkLength = 320) => {
  const paragraphs = document
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (!buffer) {
      buffer = paragraph;
      continue;
    }

    if ((buffer + "\n\n" + paragraph).length <= maxChunkLength) {
      buffer += `\n\n${paragraph}`;
      continue;
    }

    chunks.push(buffer);
    buffer = paragraph;
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChunkLength) {
      return [chunk];
    }

    const sentences = chunk
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const smallerChunks: string[] = [];
    let sentenceBuffer = "";

    for (const sentence of sentences) {
      const candidate = sentenceBuffer
        ? `${sentenceBuffer} ${sentence}`
        : sentence;
      if (candidate.length <= maxChunkLength) {
        sentenceBuffer = candidate;
        continue;
      }

      if (sentenceBuffer) {
        smallerChunks.push(sentenceBuffer);
      }
      sentenceBuffer = sentence;
    }

    if (sentenceBuffer) {
      smallerChunks.push(sentenceBuffer);
    }

    return smallerChunks;
  });
};

const scoreChunk = (questionTokens: string[], chunk: string): number => {
  const chunkTokens = new Set(tokenize(chunk));
  if (!chunkTokens.size) {
    return 0;
  }

  const overlap = questionTokens.filter((token) =>
    chunkTokens.has(token)
  ).length;
  const densityBoost = overlap / Math.max(chunkTokens.size, 1);
  return overlap * 10 + densityBoost;
};

const retrieveChunks = (question: string, document: string): ChunkScore[] => {
  const questionTokens = tokenize(question);
  if (!questionTokens.length) {
    return [];
  }

  return chunkDocument(document)
    .map((content) => ({
      content,
      score: scoreChunk(questionTokens, content)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
};

const buildAnswer = (question: string, retrievedChunks: ChunkScore[]) => {
  if (!retrievedChunks.length) {
    return "Je n'ai pas trouvé de passage suffisamment proche dans le corpus fourni.";
  }

  const questionTokens = tokenize(question);
  const candidateSentences = retrievedChunks.flatMap((chunk) =>
    chunk.content
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .map((sentence) => ({
        sentence,
        score: scoreChunk(questionTokens, sentence)
      }))
  );

  const rankedSentences = candidateSentences
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((candidate) => candidate.sentence);

  if (!rankedSentences.length) {
    return retrievedChunks[0].content;
  }

  const uniqueSentences = Array.from(new Set(rankedSentences));
  return uniqueSentences.join(" ");
};

const app = new Elysia()
  .use(
    cors({
      origin: true
    })
  )
  .get("/api/health", () => ({ status: "ok" }))
  .post(
    "/api/query",
    ({ body }) => {
      const retrievedChunks = retrieveChunks(body.question, body.documents);

      return {
        question: body.question,
        answer: buildAnswer(body.question, retrievedChunks),
        retrievedChunks: retrievedChunks.map((chunk, index) => ({
          id: index + 1,
          content: chunk.content,
          score: Number(chunk.score.toFixed(2))
        }))
      };
    },
    {
      body: t.Object({
        question: t.String({ minLength: 3 }),
        documents: t.String({ minLength: 20 })
      })
    }
  )
  .listen(3000);

console.log(
  `RAG API running on http://${app.server?.hostname}:${app.server?.port}`
);
