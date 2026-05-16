import { FormEvent, useEffect, useState } from "react";
import {
  FaCircleCheck,
  FaClock,
  FaDatabase,
  FaEye,
  FaEyeSlash,
  FaFileLines,
  FaGear,
  FaLayerGroup,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaTriangleExclamation,
  FaWandSparkles
} from "react-icons/fa6";
import { Navigate } from "react-router-dom";
import {
  ApiError,
  apiRequest,
  formatDateTime,
  useDashboardContext
} from "../app-shared";
import type { QueryResponse, RagConfigSummary } from "../app-types";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Panel,
  PanelHeading,
  TextInput
} from "../components/ui";

export function RagConfigurationPage() {
  const { user, ragConfig, setRagConfig, resetAuth } = useDashboardContext();
  const [showOpenAiApiKey, setShowOpenAiApiKey] = useState(false);
  const [showPineconeApiKey, setShowPineconeApiKey] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState(
    ragConfig.openAiApiKey || ""
  );
  const [pineconeApiKey, setPineconeApiKey] = useState(
    ragConfig.pineconeApiKey || ""
  );
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    setOpenAiApiKey(ragConfig.openAiApiKey || "");
    setPineconeApiKey(ragConfig.pineconeApiKey || "");
    setPineconeIndex(ragConfig.pineconeIndex || "");
    setPineconeHost(ragConfig.pineconeHost || "");
    setEmbeddingModel(ragConfig.embeddingModel || "text-embedding-3-small");
    setChatModel(ragConfig.chatModel || "gpt-4.1-mini");
  }, [ragConfig]);

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
      const payload = await apiRequest<{ ragConfig: RagConfigSummary }>(
        "/api/rag/configure",
        {
          method: "POST",
          body: JSON.stringify({
            openAiApiKey,
            pineconeApiKey,
            pineconeIndex,
            pineconeHost: pineconeHost || undefined,
            embeddingModel,
            chatModel
          })
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
          description={
            <>
              Configuration globale utilisée par l’indexation, la suppression
              des vecteurs et la génération finale.
            </>
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
        </div>

        <form className="subpanel" onSubmit={handleConfigure}>
          <div className="config-grid">
            <Field label="Clé OpenAI">
              <div className="secret-field">
                <TextInput
                  type={showOpenAiApiKey ? "text" : "password"}
                  value={openAiApiKey}
                  onChange={(event) => setOpenAiApiKey(event.target.value)}
                />
                <Button
                  aria-label={
                    showOpenAiApiKey
                      ? "Masquer la clé OpenAI"
                      : "Afficher la clé OpenAI"
                  }
                  className="whitespace-nowrap"
                  onClick={() => setShowOpenAiApiKey((current) => !current)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {showOpenAiApiKey ? <FaEyeSlash /> : <FaEye />}
                  <span>{showOpenAiApiKey ? "Masquer" : "Afficher"}</span>
                </Button>
              </div>
            </Field>

            <Field label="Clé Pinecone">
              <div className="secret-field">
                <TextInput
                  type={showPineconeApiKey ? "text" : "password"}
                  value={pineconeApiKey}
                  onChange={(event) => setPineconeApiKey(event.target.value)}
                />
                <Button
                  aria-label={
                    showPineconeApiKey
                      ? "Masquer la clé Pinecone"
                      : "Afficher la clé Pinecone"
                  }
                  className="whitespace-nowrap"
                  onClick={() => setShowPineconeApiKey((current) => !current)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {showPineconeApiKey ? <FaEyeSlash /> : <FaEye />}
                  <span>{showPineconeApiKey ? "Masquer" : "Afficher"}</span>
                </Button>
              </div>
            </Field>

            <Field label="Index Pinecone">
              <TextInput
                type="text"
                value={pineconeIndex}
                onChange={(event) => setPineconeIndex(event.target.value)}
              />
            </Field>

            <Field label="Host Pinecone">
              <TextInput
                type="text"
                value={pineconeHost}
                onChange={(event) => setPineconeHost(event.target.value)}
              />
            </Field>

            <Field label="Modèle d’embedding">
              <TextInput
                type="text"
                value={embeddingModel}
                onChange={(event) => setEmbeddingModel(event.target.value)}
              />
            </Field>

            <Field label="Modèle de chat">
              <TextInput
                type="text"
                value={chatModel}
                onChange={(event) => setChatModel(event.target.value)}
              />
            </Field>
          </div>

          <Button disabled={isConfiguring} fullWidth type="submit">
            <FaGear />
            <span>
              {isConfiguring ? "Enregistrement…" : "Configurer le backend RAG"}
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
      </Panel>
    </div>
  );
}

export function RagQuestionPage() {
  const { ragConfig, resetAuth } = useDashboardContext();
  const [question, setQuestion] = useState(
    "Quels groupes limitent l’accès au contexte dans ce RAG ?"
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      resetAuth();
    }
  };

  const handleQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsQuerying(true);
    setError(null);

    try {
      const payload = await apiRequest<QueryResponse>("/api/rag/query", {
        method: "POST",
        body: JSON.stringify({ question })
      });
      setResult(payload);
    } catch (error) {
      handleUnauthorized(error);
      setError(error instanceof Error ? error.message : "Requête impossible.");
    } finally {
      setIsQuerying(false);
    }
  };

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

        <form className="subpanel" onSubmit={handleQuery}>
          <Field label="Question">
            <TextInput
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              type="text"
            />
          </Field>

          <Button
            disabled={isQuerying || !ragConfig.configured}
            fullWidth
            type="submit"
          >
            <FaWandSparkles />
            <span>
              {isQuerying
                ? "Interrogation…"
                : "Interroger les documents autorisés"}
            </span>
          </Button>
        </form>

        <Card className="answer-card">
          <p className="answer-label info-line">
            <FaWandSparkles />
            <span>Réponse</span>
          </p>
          <p>{result?.answer || "Aucune requête envoyée."}</p>
        </Card>

        <div className="retrieval-list">
          {(result?.retrievedChunks || []).map((chunk) => (
            <Card
              className="retrieval-card"
              key={`${chunk.documentId}-${chunk.id}`}
            >
              <div className="retrieval-meta">
                <span className="meta-line">
                  <FaFileLines />
                  <span>{chunk.title}</span>
                </span>
                <span className="meta-line">
                  <FaMagnifyingGlass />
                  <span>Score {chunk.score}</span>
                </span>
              </div>
              <p className="muted-text meta-line">
                <FaLayerGroup />
                <span>Groupe : {chunk.group}</span>
              </p>
              <p>{chunk.content}</p>
            </Card>
          ))}

          {!result?.retrievedChunks.length ? (
            <EmptyState icon={<FaMagnifyingGlass />}>
              Les passages récupérés apparaîtront ici après la première
              question.
            </EmptyState>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
