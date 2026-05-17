import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FaCircleCheck,
  FaClock,
  FaDatabase,
  FaListCheck,
  FaEye,
  FaEyeSlash,
  FaFileLines,
  FaGear,
  FaKey,
  FaLayerGroup,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaQuoteLeft,
  FaTriangleExclamation,
  FaWandSparkles,
  FaXmark
} from "react-icons/fa6";
import { Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ApiError,
  apiRequest,
  CHUNK_MODE_OPTIONS,
  formatDateTime,
  getChunkModeLabel,
  getChunkUnitLabel,
  useDashboardContext
} from "../app-shared";
import type {
  ChunkMode,
  QueryResponse,
  QuestionCase,
  RagConfigSummary
} from "../app-types";
import {
  Banner,
  Button,
  Card,
  Divider,
  EmptyState,
  Field,
  Panel,
  PanelHeading,
  SelectInput,
  TextArea,
  TextInput
} from "../components/ui";
import { ChunkingSchema } from "../components/chunk-schema";
import { RAG_QUESTION_SETS } from "../rag-question-sets";

function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div className="markdown-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote>
              <FaQuoteLeft aria-hidden="true" />
              <div>{children}</div>
            </blockquote>
          ),
          code: ({ children }) => <code>{children}</code>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function RetrievedChunkAccordion({
  chunk
}: {
  chunk: QueryResponse["retrievedChunks"][number];
}) {
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

const getSecretStatusLabel = (
  configured: boolean,
  lastCharacters: string | null
) => {
  if (!configured) {
    return "Aucune clé enregistrée";
  }

  if (!lastCharacters) {
    return "******";
  }

  return `******${lastCharacters}`;
};

type SecretFieldProps = {
  configured: boolean;
  lastCharacters: string | null;
  label: string;
  replaceMode: boolean;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleReplace: () => void;
  onToggleVisibility: () => void;
};

function SecretField({
  configured,
  lastCharacters,
  label,
  onChange,
  onToggleReplace,
  onToggleVisibility,
  replaceMode,
  value,
  visible
}: SecretFieldProps) {
  const configuredSecretTooltip =
    "La valeur complète reste côté backend et n’est jamais renvoyée au navigateur.";

  return (
    <Field label={label}>
      <div className="flex flex-col gap-3">
        {replaceMode ? (
          <div className="secret-field">
            <div className="secret-input-wrap secret-input-wrap--editing">
              <button
                aria-label="Annuler le remplacement"
                className="secret-prefix-button"
                onClick={onToggleReplace}
                type="button"
              >
                <FaXmark />
              </button>
              <TextInput
                aria-label={`Nouvelle ${label.toLowerCase()}`}
                autoComplete="off"
                className="secret-input secret-input--with-prefix"
                placeholder={`Saisir une nouvelle ${label.toLowerCase()}`}
                type={visible ? "text" : "password"}
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
              <button
                aria-label={
                  visible
                    ? `Masquer la nouvelle ${label.toLowerCase()}`
                    : `Afficher la nouvelle ${label.toLowerCase()}`
                }
                className="secret-visibility-toggle"
                onClick={onToggleVisibility}
                type="button"
              >
                {visible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <button
                aria-label={`Modifier ${label.toLowerCase()}`}
                className="secret-status-trigger"
                onClick={onToggleReplace}
                title={configured ? configuredSecretTooltip : undefined}
                type="button"
              >
                <span className="secret-status-content">
                  <FaKey />
                  <span>
                    {getSecretStatusLabel(configured, lastCharacters)}
                  </span>
                </span>
              </button>
              {!configured ? (
                <p className="m-0 text-sm text-ink-700">
                  Ajoutez une clé pour activer ce fournisseur dans la
                  configuration RAG.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

export function RagConfigurationPage() {
  const { user, ragConfig, setRagConfig, resetAuth } = useDashboardContext();
  const defaultChunkMode: ChunkMode = "characters";
  const defaultChunkSize = 320;
  const defaultChunkOverlap = 40;
  const [showOpenAiApiKey, setShowOpenAiApiKey] = useState(false);
  const [showPineconeApiKey, setShowPineconeApiKey] = useState(false);
  const [replaceOpenAiApiKey, setReplaceOpenAiApiKey] = useState(false);
  const [replacePineconeApiKey, setReplacePineconeApiKey] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [pineconeApiKey, setPineconeApiKey] = useState("");
  const [pineconeIndex, setPineconeIndex] = useState(
    ragConfig.pineconeIndex || ""
  );
  const [pineconeHost, setPineconeHost] = useState(
    ragConfig.pineconeHost || ""
  );
  const [embeddingModel, setEmbeddingModel] = useState(
    ragConfig.embeddingModel || "text-embedding-3-small"
  );
  const [chatModel, setChatModel] = useState(
    ragConfig.chatModel || "gpt-4.1-mini"
  );
  const [chunkMode, setChunkMode] = useState<ChunkMode>(
    ragConfig.chunkMode || defaultChunkMode
  );
  const [chunkSize, setChunkSize] = useState(
    String(ragConfig.chunkSize || 320)
  );
  const [chunkOverlap, setChunkOverlap] = useState(
    String(ragConfig.chunkOverlap || 40)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const chunkSizeValue = Math.max(1, Number(chunkSize) || defaultChunkSize);
  const chunkOverlapValue = Math.max(
    0,
    Number(chunkOverlap) || defaultChunkOverlap
  );
  const chunkStrideValue = chunkSizeValue - chunkOverlapValue;
  const chunkUnitLabel = getChunkUnitLabel(chunkMode);

  useEffect(() => {
    setOpenAiApiKey("");
    setPineconeApiKey("");
    setReplaceOpenAiApiKey(false);
    setReplacePineconeApiKey(false);
    setShowOpenAiApiKey(false);
    setShowPineconeApiKey(false);
    setPineconeIndex(ragConfig.pineconeIndex || "");
    setPineconeHost(ragConfig.pineconeHost || "");
    setEmbeddingModel(ragConfig.embeddingModel || "text-embedding-3-small");
    setChatModel(ragConfig.chatModel || "gpt-4.1-mini");
    setChunkMode(ragConfig.chunkMode || defaultChunkMode);
    setChunkSize(String(ragConfig.chunkSize || 320));
    setChunkOverlap(String(ragConfig.chunkOverlap || 40));
  }, [defaultChunkMode, ragConfig]);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      resetAuth();
    }
  };

  const handleConfigure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsConfiguring(true);
    setError(null);
    setMessage(null);

    try {
      const requestBody: {
        openAiApiKey?: string;
        pineconeApiKey?: string;
        pineconeIndex: string;
        pineconeHost?: string;
        embeddingModel: string;
        chatModel: string;
        chunkMode: ChunkMode;
        chunkSize: number;
        chunkOverlap: number;
      } = {
        pineconeIndex,
        pineconeHost: pineconeHost || undefined,
        embeddingModel,
        chatModel,
        chunkMode,
        chunkSize: chunkSizeValue,
        chunkOverlap: chunkOverlapValue
      };

      if (chunkOverlapValue >= chunkSizeValue) {
        throw new Error(
          "L'overlap doit rester strictement inférieur à la taille de chunk."
        );
      }

      if (replaceOpenAiApiKey) {
        requestBody.openAiApiKey = openAiApiKey;
      }

      if (replacePineconeApiKey) {
        requestBody.pineconeApiKey = pineconeApiKey;
      }

      const payload = await apiRequest<{ ragConfig: RagConfigSummary }>(
        "/api/rag/configure",
        {
          method: "POST",
          body: JSON.stringify(requestBody)
        }
      );
      setRagConfig(payload.ragConfig);
      setMessage("Configuration RAG mise à jour côté backend.");
    } catch (error) {
      handleUnauthorized(error);
      setError(
        error instanceof Error ? error.message : "Configuration impossible."
      );
    } finally {
      setIsConfiguring(false);
    }
  };

  if (!user.isAdmin) {
    return <Navigate replace to="/app/rag" />;
  }

  return (
    <div className="page-grid">
      <Panel className="page-panel">
        <PanelHeading
          className="mb-5"
          description={
            <>Paramètres utilisés par l’indexation et les requêtes RAG.</>
          }
          icon={<FaGear />}
          title="Configuration du backend RAG"
        />

        <div className="status-grid">
          <Card className="info-card">
            <p className="answer-label info-line">
              <FaCircleCheck />
              <span>État</span>
            </p>
            <p>{ragConfig.configured ? "Configuré" : "Non configuré"}</p>
            <p className="muted-text meta-line">
              <FaShieldHalved />
              <span>Namespace : {ragConfig.namespace || "rag-demo"}</span>
            </p>
          </Card>
          <Card className="info-card">
            <p className="answer-label info-line">
              <FaDatabase />
              <span>Index Pinecone</span>
            </p>
            <p>{ragConfig.pineconeIndex || "-"}</p>
            <p className="muted-text meta-line">
              <FaClock />
              <span>Mis à jour : {formatDateTime(ragConfig.updatedAt)}</span>
            </p>
          </Card>
          <Card className="info-card">
            <p className="answer-label info-line">
              <FaDatabase />
              <span>Chunking</span>
            </p>
            <p>
              {getChunkModeLabel(ragConfig.chunkMode)} · {ragConfig.chunkSize}{" "}
              {getChunkUnitLabel(ragConfig.chunkMode)}, overlap{" "}
              {ragConfig.chunkOverlap} {getChunkUnitLabel(ragConfig.chunkMode)}
            </p>
            <p className="muted-text meta-line">
              <FaClock />
              <span>
                Stride : {ragConfig.chunkStride}{" "}
                {getChunkUnitLabel(ragConfig.chunkMode)}
              </span>
            </p>
          </Card>
        </div>

        <Divider className="my-5" />

        <form className="subpanel" onSubmit={handleConfigure}>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-sm font-semibold text-ink-900">
              Secrets fournisseurs
            </p>
            <p className="m-0 text-sm text-ink-700">
              Vérifiez rapidement quelles clés sont déjà en place, puis
              remplacez uniquement celles qui changent.
            </p>
          </div>

          <div className="grid gap-4">
            <SecretField
              configured={ragConfig.openAiApiKeyConfigured}
              label="Clé OpenAI"
              lastCharacters={ragConfig.openAiApiKeyLast4}
              replaceMode={replaceOpenAiApiKey}
              value={openAiApiKey}
              visible={showOpenAiApiKey}
              onChange={setOpenAiApiKey}
              onToggleReplace={() => {
                setReplaceOpenAiApiKey((current) => !current);
                setOpenAiApiKey("");
                setShowOpenAiApiKey(false);
              }}
              onToggleVisibility={() =>
                setShowOpenAiApiKey((current) => !current)
              }
            />

            <SecretField
              configured={ragConfig.pineconeApiKeyConfigured}
              label="Clé Pinecone"
              lastCharacters={ragConfig.pineconeApiKeyLast4}
              replaceMode={replacePineconeApiKey}
              value={pineconeApiKey}
              visible={showPineconeApiKey}
              onChange={setPineconeApiKey}
              onToggleReplace={() => {
                setReplacePineconeApiKey((current) => !current);
                setPineconeApiKey("");
                setShowPineconeApiKey(false);
              }}
              onToggleVisibility={() =>
                setShowPineconeApiKey((current) => !current)
              }
            />
          </div>

          <Divider className="my-5" />

          <div className="flex flex-col gap-1">
            <p className="m-0 text-sm font-semibold text-ink-900">
              Paramètres techniques
            </p>
            <p className="m-0 text-sm text-ink-700">
              Modifiez ici l’index, le host, les modèles et les paramètres de
              chunking utilisés par le backend.
            </p>
          </div>

          <div className="config-grid">
            <Field label="Index Pinecone">
              <TextInput
                placeholder="Ex. rag-demo"
                type="text"
                value={pineconeIndex}
                onChange={(event) => setPineconeIndex(event.target.value)}
              />
            </Field>

            <Field label="Host Pinecone">
              <TextInput
                placeholder="Ex. xxx.svc.aped-4627-b74a.pinecone.io"
                type="text"
                value={pineconeHost}
                onChange={(event) => setPineconeHost(event.target.value)}
              />
            </Field>

            <Field label="Modèle d’embedding">
              <TextInput
                placeholder="Ex. text-embedding-3-small"
                type="text"
                value={embeddingModel}
                onChange={(event) => setEmbeddingModel(event.target.value)}
              />
            </Field>

            <Field label="Modèle de chat">
              <TextInput
                placeholder="Ex. gpt-4.1-mini"
                type="text"
                value={chatModel}
                onChange={(event) => setChatModel(event.target.value)}
              />
            </Field>

            <Field label="Mode de chunking">
              <SelectInput
                value={chunkMode}
                onChange={(event) =>
                  setChunkMode(event.target.value as ChunkMode)
                }
              >
                {CHUNK_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label={`Taille de chunk (${chunkUnitLabel})`}>
              <TextInput
                min={1}
                step={1}
                type="number"
                value={chunkSize}
                onChange={(event) => setChunkSize(event.target.value)}
              />
            </Field>

            <Field label={`Overlap (${chunkUnitLabel})`}>
              <TextInput
                min={0}
                step={1}
                type="number"
                value={chunkOverlap}
                onChange={(event) => setChunkOverlap(event.target.value)}
              />
            </Field>
          </div>

          <Card className="compact-card">
            <p className="m-0 text-sm font-semibold text-ink-900">
              Stride calculé
            </p>
            <p className="m-0 text-sm text-ink-700">
              {chunkStrideValue > 0
                ? `${chunkStrideValue} ${chunkUnitLabel} (${chunkSizeValue} - ${chunkOverlapValue})`
                : "Le stride doit rester strictement positif."}
            </p>
            {chunkMode === "tokens" ? (
              <p className="m-0 text-sm text-ink-700">
                Le mode tokens utilise tiktoken pour compter les segments.
              </p>
            ) : null}
            <ChunkingSchema
              chunkOverlap={chunkOverlapValue}
              chunkSize={chunkSizeValue}
              unitLabel={chunkUnitLabel}
            />
          </Card>

          <Divider className="my-5" />

          <Button
            disabled={
              isConfiguring ||
              !pineconeIndex.trim() ||
              chunkOverlapValue >= chunkSizeValue
            }
            fullWidth
            type="submit"
          >
            <FaGear />
            <span>
              {isConfiguring
                ? "Enregistrement…"
                : "Enregistrer la configuration"}
            </span>
          </Button>
        </form>

        {message ? (
          <Banner icon={<FaCircleCheck />} tone="success">
            {message}
          </Banner>
        ) : null}
        {error ? (
          <Banner icon={<FaTriangleExclamation />} tone="error">
            {error}
          </Banner>
        ) : null}
        {chunkOverlapValue >= chunkSizeValue ? (
          <Banner icon={<FaTriangleExclamation />} tone="error">
            L’overlap doit rester strictement inférieur à la taille de chunk.
          </Banner>
        ) : null}
      </Panel>
    </div>
  );
}

export function RagQuestionPage() {
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
  const [selectedBenchmarkCaseId, setSelectedBenchmarkCaseId] = useState("");
  const selectedBenchmarkCase = useMemo(
    () =>
      accessibleBenchmarkCases.find(
        (questionCase) => questionCase.id === selectedBenchmarkCaseId
      ) ||
      accessibleBenchmarkCases[0] ||
      null,
    [accessibleBenchmarkCases, selectedBenchmarkCaseId]
  );
  const [evaluatedBenchmarkCaseId, setEvaluatedBenchmarkCaseId] = useState<
    string | null
  >(null);
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

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
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
    } catch (error) {
      handleUnauthorized(error);
      setError(error instanceof Error ? error.message : "Requête impossible.");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEvaluatedBenchmarkCaseId(null);
    await runQuery(question);
  };

  const questionIsEmpty = !question.trim();

  return (
    <div className="page-grid">
      {!ragConfig.configured ? (
        <Banner icon={<FaShieldHalved />} tone="info">
          Le backend RAG doit être configuré avant toute interrogation.
        </Banner>
      ) : null}
      {error ? (
        <Banner icon={<FaTriangleExclamation />} tone="error">
          {error}
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

        <Card className="question-composer-card">
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

          <form className="question-composer-form" onSubmit={handleQuery}>
            <Field label="Votre question">
              <TextArea
                placeholder="Ex. Quels éléments du corpus décrivent le parcours d'admission d'un patient ?"
                rows={4}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </Field>

            <div className="question-composer-card__actions">
              <Button
                disabled={
                  isQuerying || !ragConfig.configured || questionIsEmpty
                }
                type="submit"
              >
                <FaWandSparkles />
                <span>{isQuerying ? "Interrogation…" : "Interroger"}</span>
              </Button>
              <p className="muted-text meta-line m-0">
                <FaMagnifyingGlass />
                <span>
                  Les passages les plus pertinents apparaissent sous la réponse.
                </span>
              </p>
            </div>
          </form>

          {starterQuestions.length ? (
            <div className="suggested-questions">
              <div className="suggested-questions__header">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-semibold text-ink-900">
                    Exemples de demarrage
                  </p>
                  <p className="m-0 text-sm text-ink-700">
                    Raccourcis utiles pour lancer rapidement une premiere
                    requete.
                  </p>
                </div>
                {trainingSet ? (
                  <span className="status-chip">
                    <FaListCheck />
                    <span>{trainingSet.title}</span>
                  </span>
                ) : null}
              </div>

              <div className="suggested-questions__grid">
                {starterQuestions.map((questionCase) => (
                  <button
                    className="suggestion-card"
                    disabled={!ragConfig.configured || isQuerying}
                    key={questionCase.id}
                    type="button"
                    onClick={async () => {
                      setEvaluatedBenchmarkCaseId(null);
                      await runQuery(questionCase.question);
                    }}
                  >
                    <span className="suggestion-card__title">
                      {questionCase.title}
                    </span>
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
          ) : null}

          {accessibleBenchmarkCases.length ? (
            <details className="benchmark-disclosure">
              <summary className="benchmark-disclosure__summary">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-semibold text-ink-900">
                    Benchmark et evaluation
                  </p>
                  <p className="m-0 text-sm text-ink-700">
                    Outil secondaire pour comparer une reponse a un cas de
                    reference.
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
                      {accessibleBenchmarkCases.map((questionCase) => (
                        <option key={questionCase.id} value={questionCase.id}>
                          {questionCase.title}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <div className="benchmark-toolbar__actions">
                    <Button
                      disabled={
                        !ragConfig.configured ||
                        isQuerying ||
                        !selectedBenchmarkCase
                      }
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        if (!selectedBenchmarkCase) {
                          return;
                        }

                        setEvaluatedBenchmarkCaseId(selectedBenchmarkCase.id);
                        await runQuery(selectedBenchmarkCase.question);
                      }}
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
                        <p className="benchmark-card__label">
                          Documents attendus
                        </p>
                        <ul className="benchmark-list">
                          {evaluatedBenchmarkCase.expectedDocuments.map(
                            (document) => (
                              <li key={document}>{document}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="benchmark-card__label">
                          Doit idealement couvrir
                        </p>
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
          ) : null}
        </Card>

        <Card className="answer-card">
          <p className="answer-label info-line">
            <FaWandSparkles />
            <span>Réponse</span>
          </p>
          {result?.answer ? (
            <MarkdownAnswer content={result.answer} />
          ) : (
            <p>Aucune requête envoyée.</p>
          )}
        </Card>

        <div className="retrieval-section">
          <div className="retrieval-section__header">
            <div className="flex flex-col gap-1">
              <p className="answer-label info-line">
                <FaFileLines />
                <span>Sources (Passages récupérés)</span>
              </p>
              <p className="m-0 text-sm text-ink-700">
                Les métadonnées restent visibles. Le contenu détaillé est replié
                par défaut pour préserver la lecture de la réponse.
              </p>
            </div>
            {result?.retrievedChunks?.length ? (
              <span className="status-chip">
                <FaMagnifyingGlass />
                <span>{result.retrievedChunks.length} chunk(s)</span>
              </span>
            ) : null}
          </div>

          <div className="retrieval-list">
            {(result?.retrievedChunks || []).map((chunk) => (
              <RetrievedChunkAccordion
                chunk={chunk}
                key={`${chunk.documentId}-${chunk.id}`}
              />
            ))}

            {!result?.retrievedChunks.length ? (
              <EmptyState icon={<FaMagnifyingGlass />}>
                Les passages récupérés apparaîtront ici après la première
                question.
              </EmptyState>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}
