import { useEffect, useState } from "react";
import {
  FaArrowsLeftRight,
  FaChartColumn,
  FaCode,
  FaDatabase,
  FaHashtag,
  FaLayerGroup,
  FaScissors,
  FaWandSparkles
} from "react-icons/fa6";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Panel,
  PanelHeading,
  SelectInput,
  TextArea,
  TextInput
} from "../components/ui";
import type { Tiktoken } from "js-tiktoken/lite";

const tokenizerOptions = [
  {
    value: "gpt-4o-mini",
    label: "gpt-4o-mini",
    encoding: "o200k_base",
    description: "gpt-4o-mini (o200k_base)"
  },
  {
    value: "gpt-4.1-mini",
    label: "gpt-4.1-mini",
    encoding: "o200k_base",
    description: "gpt-4.1-mini (o200k_base)"
  },
  {
    value: "text-embedding-3-small",
    label: "text-embedding-3-small",
    encoding: "cl100k_base",
    description: "text-embedding-3-small (cl100k_base)"
  },
  {
    value: "text-embedding-3-large",
    label: "text-embedding-3-large",
    encoding: "cl100k_base",
    description: "text-embedding-3-large (cl100k_base)"
  },
  {
    value: "gpt-4-turbo",
    label: "gpt-4-turbo",
    encoding: "cl100k_base",
    description: "gpt-4-turbo (cl100k_base)"
  },
  {
    value: "cl100k_base",
    label: "cl100k_base",
    encoding: "cl100k_base",
    description: "cl100k_base"
  },
  {
    value: "o200k_base",
    label: "o200k_base",
    encoding: "o200k_base",
    description: "o200k_base"
  }
] as const;

type TokenizerEncodingName = (typeof tokenizerOptions)[number]["encoding"];
type TokenizerInstance = Pick<Tiktoken, "encode" | "decode">;

const tokenizerReference = [
  { model: "text-embedding-3-small", encoding: "cl100k_base" },
  { model: "text-embedding-3-large", encoding: "cl100k_base" },
  { model: "gpt-4-turbo", encoding: "cl100k_base" },
  { model: "gpt-4o-mini", encoding: "o200k_base" },
  { model: "gpt-4.1-mini", encoding: "o200k_base" }
] as const;

const sampleTexts = [
  {
    label: "Consigne courte",
    text: "Explique la différence entre chunk size, overlap et top K dans un pipeline RAG."
  },
  {
    label: "Texte métier",
    text: "Le patient peut accéder à son dossier, demander une rectification et solliciter un médiateur hospitalier en cas de litige. Les délais de communication varient selon l'ancienneté des pièces médicales."
  },
  {
    label: "Texte mixte code + prose",
    text: "const chunkSize = 320;\nconst overlap = 40;\n\nOn veut montrer aux stagiaires que 320 caractères ne signifient pas 320 tokens, et que le budget de contexte change selon la langue, la ponctuation et le code."
  }
] as const;

const TIKTOKEN_RANKS_BASE_URL = "https://tiktoken.pages.dev/js";

const tokenizerCache = new Map<
  TokenizerEncodingName,
  Promise<TokenizerInstance>
>();

const loadTokenizer = async (
  encodingName: TokenizerEncodingName
): Promise<TokenizerInstance> => {
  const cached = tokenizerCache.get(encodingName);
  if (cached) {
    return cached;
  }

  const tokenizerPromise = (async () => {
    const [{ Tiktoken }, response] = await Promise.all([
      import("js-tiktoken/lite"),
      fetch(`${TIKTOKEN_RANKS_BASE_URL}/${encodingName}.json`)
    ]);

    if (!response.ok) {
      throw new Error(
        `Téléchargement du tokenizer ${encodingName} impossible (HTTP ${response.status}).`
      );
    }

    const ranks = await response.json();
    return new Tiktoken(ranks);
  })();

  tokenizerCache.set(encodingName, tokenizerPromise);
  return tokenizerPromise;
};

const formatDecodedToken = (value: string) =>
  JSON.stringify(value)
    .replace(/ /g, "\u00a0")
    .replace(/\\r/g, "\\r")
    .replace(/\\n/g, "\\n")
    .replace(/\\t/g, "\\t");

const countWords = (text: string) => {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
};

const chunkTokens = (tokens: number[], budget: number, overlap: number) => {
  if (!tokens.length || budget <= 0) {
    return [];
  }

  const safeOverlap = Math.min(Math.max(overlap, 0), Math.max(budget - 1, 0));
  const step = Math.max(1, budget - safeOverlap);
  const chunks: Array<{ start: number; end: number; tokens: number[] }> = [];

  for (let start = 0; start < tokens.length; start += step) {
    const end = Math.min(tokens.length, start + budget);
    chunks.push({
      start,
      end,
      tokens: tokens.slice(start, end)
    });

    if (end >= tokens.length) {
      break;
    }
  }

  return chunks;
};

export function TiktokenDemoPage() {
  const [tokenizerName, setTokenizerName] = useState<string>(
    "text-embedding-3-small"
  );
  const [sourceText, setSourceText] = useState<string>(sampleTexts[1].text);
  const [chunkBudget, setChunkBudget] = useState("60");
  const [overlap, setOverlap] = useState("10");
  const [tokenizer, setTokenizer] = useState<TokenizerInstance | null>(null);
  const [tokenizerError, setTokenizerError] = useState<string | null>(null);
  const [isTokenizerLoading, setIsTokenizerLoading] = useState(true);

  const selectedTokenizerOption =
    tokenizerOptions.find((option) => option.value === tokenizerName) ||
    tokenizerOptions[0];

  useEffect(() => {
    let isCancelled = false;

    setIsTokenizerLoading(true);
    setTokenizerError(null);

    void loadTokenizer(selectedTokenizerOption.encoding)
      .then((instance) => {
        if (isCancelled) {
          return;
        }

        setTokenizer(instance);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setTokenizer(null);
        setTokenizerError(
          error instanceof Error
            ? error.message
            : "Chargement distant du tokenizer impossible."
        );
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }

        setIsTokenizerLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedTokenizerOption.encoding]);

  const tokens = sourceText && tokenizer ? tokenizer.encode(sourceText) : [];
  const budget = Math.max(1, Number(chunkBudget) || 1);
  const overlapValue = Math.max(0, Number(overlap) || 0);
  const simulatedChunks = chunkTokens(tokens, budget, overlapValue);
  const displayedTokens = tokens.slice(0, 80);
  const words = countWords(sourceText);
  const averageCharsPerToken = tokens.length
    ? (sourceText.length / tokens.length).toFixed(2)
    : "0.00";
  const averageWordsPerToken = tokens.length
    ? (words / tokens.length).toFixed(2)
    : "0.00";

  const isTokenizerReady = Boolean(tokenizer) && !isTokenizerLoading;

  return (
    <div className="page-grid">
      <Panel className="page-panel">
        <PanelHeading
          description="Visualiser comment un tokenizer de type Tiktoken transforme un texte en identifiants, puis simuler l'effet d'un budget de chunk et d'un overlap en tokens."
          icon={<FaCode />}
          title="Démo unitaire · Tiktoken"
        />

        {tokenizerError ? (
          <Banner className="mt-5" icon={<FaDatabase />} tone="error">
            {tokenizerError}
          </Banner>
        ) : null}

        {isTokenizerLoading ? (
          <Banner className="mt-5" icon={<FaDatabase />} tone="info">
            Chargement distant du tokenizer {selectedTokenizerOption.encoding}…
          </Banner>
        ) : null}

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4">
            <Field label="Modèle ou encodage">
              <SelectInput
                value={tokenizerName}
                onChange={(event) => setTokenizerName(event.target.value)}
              >
                {tokenizerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.description}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Texte à tokeniser">
              <TextArea
                className="min-h-[260px]"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              {sampleTexts.map((sample) => (
                <Button
                  className="min-h-10"
                  key={sample.label}
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => setSourceText(sample.text)}
                >
                  <FaWandSparkles />
                  <span>{sample.label}</span>
                </Button>
              ))}
            </div>

            <Card className="space-y-3">
              <p className="m-0 text-sm font-semibold text-ink-900">
                Très important
              </p>
              <p className="m-0 text-sm text-ink-700">
                Beaucoup de modèles différents utilisent en réalité le même
                tokenizer. Le choix du modèle n'implique donc pas toujours un
                changement d'encodage.
              </p>
              <div className="rounded-control border border-stroke-softer bg-ink-950/4 px-4 py-3">
                <p className="m-0 font-mono text-sm text-ink-950">
                  {tokenizerName === selectedTokenizerOption.encoding
                    ? `encodage direct : ${selectedTokenizerOption.encoding}`
                    : `${tokenizerName} -> ${selectedTokenizerOption.encoding}`}
                </p>
              </div>
            </Card>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="space-y-1">
                <p className="answer-label info-line">
                  <FaChartColumn />
                  <span>Volume brut</span>
                </p>
                <p className="m-0 text-3xl font-semibold text-ink-950">
                  {sourceText.length}
                </p>
                <p className="m-0 text-sm text-ink-700">caractères</p>
              </Card>

              <Card className="space-y-1">
                <p className="answer-label info-line">
                  <FaHashtag />
                  <span>Tokens</span>
                </p>
                <p className="m-0 text-3xl font-semibold text-ink-950">
                  {tokens.length}
                </p>
                <p className="m-0 text-sm text-ink-700">
                  {words} mots approximatifs
                </p>
              </Card>

              <Card className="space-y-1">
                <p className="answer-label info-line">
                  <FaArrowsLeftRight />
                  <span>Chars / token</span>
                </p>
                <p className="m-0 text-3xl font-semibold text-ink-950">
                  {averageCharsPerToken}
                </p>
                <p className="m-0 text-sm text-ink-700">moyenne observée</p>
              </Card>

              <Card className="space-y-1 sm:col-span-2">
                <p className="answer-label info-line">
                  <FaLayerGroup />
                  <span>Tokenizer réel</span>
                </p>
                <div className="max-w-full overflow-x-auto pb-1">
                  <p className="m-0 inline-flex min-h-12 items-center rounded-control border border-stroke-softer bg-ink-950/4 px-4 py-3 font-mono text-[clamp(1.05rem,2vw,1.4rem)] font-semibold whitespace-nowrap text-ink-950">
                    {selectedTokenizerOption.encoding}
                  </p>
                </div>
                <p className="m-0 text-sm text-ink-700">
                  encodage effectivement utilisé
                </p>
              </Card>
            </div>

            <Card className="space-y-3">
              <p className="m-0 text-sm font-semibold text-ink-900">
                Lecture pédagogique
              </p>
              <p className="m-0 text-sm text-ink-700">
                Le même texte ne consomme pas le même budget selon le tokenizer,
                la langue, la ponctuation ou la présence de code. Cette page
                permet de montrer pourquoi une taille de chunk en caractères
                n'est pas équivalente à une taille en tokens.
              </p>
            </Card>

            <Card className="space-y-3">
              <p className="m-0 text-sm font-semibold text-ink-900">
                Correspondance réelle modèle → encodage
              </p>
              <div className="overflow-hidden rounded-card border border-stroke-softer">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(112px,132px)] bg-ink-950/6 px-4 py-3 text-xs font-semibold text-ink-900 sm:text-sm">
                  <span>Modèle</span>
                  <span>Encoding</span>
                </div>
                {tokenizerReference.map((entry) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_minmax(112px,132px)] border-t border-stroke-softer px-4 py-3 text-xs text-ink-900 sm:text-sm"
                    key={entry.model}
                  >
                    <span className="min-w-0 break-words pr-3">
                      {entry.model}
                    </span>
                    <span className="break-words">{entry.encoding}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Panel>

      <div className="page-grid">
        <Panel className="page-panel">
          <PanelHeading
            description="Chaque entier correspond à un token. Le rendu décodé token par token aide à montrer les espaces, suffixes et découpages non intuitifs."
            icon={<FaDatabase />}
            title="Tokens générés"
          />

          {!displayedTokens.length ? (
            <EmptyState icon={<FaHashtag />}>
              {isTokenizerReady
                ? "Saisissez un texte pour afficher les tokens."
                : "Le tokenizer se charge avant l'affichage des tokens."}
            </EmptyState>
          ) : (
            <div className="mt-5 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {displayedTokens.map((token: number, index: number) => (
                  <Card className="space-y-2 p-4" key={`${token}-${index}`}>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">
                      Token {index + 1}
                    </p>
                    <p className="m-0 break-all font-mono text-sm text-ink-950">
                      {token}
                    </p>
                    <p className="m-0 overflow-x-auto rounded-control bg-ink-950/6 px-3 py-2 font-mono text-sm whitespace-nowrap text-ink-900">
                      {formatDecodedToken(tokenizer?.decode([token]) || "")}
                    </p>
                  </Card>
                ))}
              </div>

              {tokens.length > displayedTokens.length ? (
                <p className="m-0 text-sm text-ink-700">
                  Affichage limité aux {displayedTokens.length} premiers tokens
                  sur {tokens.length}.
                </p>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel className="page-panel">
          <PanelHeading
            description="Simulation simple d'un chunking en tokens pour montrer l'effet combiné d'un budget de chunk et d'un overlap."
            icon={<FaScissors />}
            title="Simulation de chunking"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Budget de chunk (tokens)">
              <TextInput
                min="1"
                step="1"
                type="number"
                value={chunkBudget}
                onChange={(event) => setChunkBudget(event.target.value)}
              />
            </Field>

            <Field label="Overlap (tokens)">
              <TextInput
                min="0"
                step="1"
                type="number"
                value={overlap}
                onChange={(event) => setOverlap(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Card className="space-y-1">
              <p className="m-0 text-sm font-semibold text-ink-900">
                Chunks simulés
              </p>
              <p className="m-0 text-3xl font-semibold text-ink-950">
                {simulatedChunks.length}
              </p>
            </Card>

            <Card className="space-y-1">
              <p className="m-0 text-sm font-semibold text-ink-900">
                Budget effectif
              </p>
              <p className="m-0 text-3xl font-semibold text-ink-950">
                {budget}
              </p>
            </Card>

            <Card className="space-y-1">
              <p className="m-0 text-sm font-semibold text-ink-900">
                Recouvrement
              </p>
              <p className="m-0 text-3xl font-semibold text-ink-950">
                {Math.min(overlapValue, Math.max(budget - 1, 0))}
              </p>
            </Card>
          </div>

          <div className="mt-5 grid gap-3">
            {!isTokenizerReady ? (
              <EmptyState icon={<FaScissors />}>
                Le tokenizer se charge avant la simulation de chunking.
              </EmptyState>
            ) : (
              simulatedChunks.map((chunk, index) => (
                <Card className="space-y-2" key={`${chunk.start}-${chunk.end}`}>
                  <p className="m-0 text-sm font-semibold text-ink-900">
                    Chunk {index + 1} · tokens {chunk.start + 1} à {chunk.end}
                  </p>
                  <p className="m-0 text-sm text-ink-700">
                    {chunk.tokens.length} tokens dans cette fenêtre.
                  </p>
                  <p className="m-0 rounded-card bg-surface-warm px-4 py-3 text-sm leading-6 text-ink-900">
                    {tokenizer?.decode(chunk.tokens) || ""}
                  </p>
                </Card>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
