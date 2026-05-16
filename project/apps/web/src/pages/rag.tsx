import { FormEvent, useEffect, useState } from "react";
import {
  FaCircleCheck,
  FaClock,
  FaDatabase,
  FaEye,
  FaEyeSlash,
  FaFileLines,
  FaGear,
  FaKey,
  FaLayerGroup,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaTriangleExclamation,
  FaWandSparkles,
  FaXmark
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
  Divider,
  EmptyState,
  Field,
  Panel,
  PanelHeading,
  TextInput
} from "../components/ui";

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
      <Card className="flex flex-col gap-3">
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
      </Card>
    </Field>
  );
}

export function RagConfigurationPage() {
  const { user, ragConfig, setRagConfig, resetAuth } = useDashboardContext();
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

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
      const requestBody: {
        openAiApiKey?: string;
        pineconeApiKey?: string;
        pineconeIndex: string;
        pineconeHost?: string;
        embeddingModel: string;
        chatModel: string;
      } = {
        pineconeIndex,
        pineconeHost: pineconeHost || undefined,
        embeddingModel,
        chatModel
      };

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
        </div>

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
              Modifiez ici uniquement l’index, le host et les modèles utilisés
              par le backend.
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
          </div>

          <Button disabled={isConfiguring} fullWidth type="submit">
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
