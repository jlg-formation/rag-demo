import { FormEvent, useMemo, useState } from "react";

type ConfigureResponse = {
  sessionId: string;
  config: {
    pineconeIndex: string;
    pineconeHost: string | null;
    embeddingModel: string;
    chatModel: string;
  };
};

type IndexResponse = {
  sessionId: string;
  namespace: string;
  chunkCount: number;
  embeddingModel: string;
};

type QueryResponse = {
  question: string;
  answer: string;
  namespace: string;
  chatModel: string;
  embeddingModel: string;
  retrievedChunks: Array<{
    id: number;
    content: string;
    score: number;
  }>;
};

const sampleDocuments = `Le Retrieval-Augmented Generation, ou RAG, combine une phase de recherche documentaire et une phase de réponse assistée par contexte. Le principe consiste à interroger une base de connaissances, récupérer les passages pertinents, puis les injecter dans le prompt du modèle.

Dans une architecture simple, le pipeline se découpe en quatre étapes : ingestion des documents, découpage en chunks, indexation puis recherche. Chaque chunk conserve assez de contexte pour être compris isolément mais reste suffisamment court pour être bien classé.

La qualité de la réponse dépend fortement de la stratégie de chunking et du mécanisme de ranking. Un mauvais découpage peut disperser l'information utile, alors qu'un bon découpage améliore à la fois le rappel et la précision.

Dans un système de démonstration, une similarité lexicale peut suffire pour expliquer le principe général. En production, on utilise plutôt des embeddings, un reranker et des garde-fous sur les sources.`;

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;
  return configuredUrl ? configuredUrl.replace(/\/$/, "") : "";
};

export default function App() {
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [pineconeApiKey, setPineconeApiKey] = useState("");
  const [pineconeIndex, setPineconeIndex] = useState("");
  const [pineconeHost, setPineconeHost] = useState("");
  const [chatModel, setChatModel] = useState("gpt-4.1-mini");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [documents, setDocuments] = useState(sampleDocuments);
  const [question, setQuestion] = useState(
    "Pourquoi le chunking est-il important dans un RAG ?"
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<ConfigureResponse["config"] | null>(null);
  const [indexSummary, setIndexSummary] = useState<IndexResponse | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const parseApiError = async (response: Response) => {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error || "La requête a échoué.";
    } catch {
      return "La requête a échoué.";
    }
  };

  const handleConfigure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsConfiguring(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/configure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          openAiApiKey,
          pineconeApiKey,
          pineconeIndex,
          pineconeHost: pineconeHost || undefined,
          chatModel,
          embeddingModel
        })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const payload = (await response.json()) as ConfigureResponse;
      setSessionId(payload.sessionId);
      setConfiguration(payload.config);
      setIndexSummary(null);
      setResult(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de configurer le backend."
      );
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleIndex = async () => {
    if (!sessionId) {
      setError("Configurez d'abord OpenAI et Pinecone.");
      return;
    }

    setIsIndexing(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId, documents })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const payload = (await response.json()) as IndexResponse;
      setIndexSummary(payload);
      setResult(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'indexer le corpus."
      );
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionId) {
      setError("Configurez d'abord OpenAI et Pinecone.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId, question })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const payload = (await response.json()) as QueryResponse;
      setResult(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de joindre le serveur."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Démo RAG OpenAI + Pinecone</p>
        <h1>Configurer les clés, indexer le corpus, puis interroger un vrai pipeline RAG</h1>
        <p className="hero-copy">
          Le frontend transmet les secrets au backend uniquement pour la session
          courante. Le backend conserve cette configuration en mémoire, génère les
          embeddings OpenAI, indexe les chunks dans Pinecone, puis interroge un
          modèle de chat OpenAI avec le contexte récupéré.
        </p>
        <div className="pipeline">
          <span>Configuration</span>
          <span>Embeddings</span>
          <span>Pinecone</span>
          <span>Chat OpenAI</span>
        </div>
      </section>

      <section className="workspace-grid">
        <section className="panel stack-panel">
          <div className="panel-heading">
            <h2>1. Configuration backend</h2>
            <p>Les clés sont envoyées depuis le frontend, mais conservées en mémoire côté serveur.</p>
          </div>

          <form className="subpanel" onSubmit={handleConfigure}>
            <div className="config-grid">
              <label className="field">
                <span>Clé OpenAI</span>
                <input
                  type="password"
                  value={openAiApiKey}
                  onChange={(event) => setOpenAiApiKey(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Clé Pinecone</span>
                <input
                  type="password"
                  value={pineconeApiKey}
                  onChange={(event) => setPineconeApiKey(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Index Pinecone</span>
                <input
                  type="text"
                  value={pineconeIndex}
                  onChange={(event) => setPineconeIndex(event.target.value)}
                  placeholder="rag-demo"
                />
              </label>

              <label className="field">
                <span>Host Pinecone</span>
                <input
                  type="text"
                  value={pineconeHost}
                  onChange={(event) => setPineconeHost(event.target.value)}
                  placeholder="Optionnel si le SDK retrouve déjà l'index"
                />
              </label>

              <label className="field">
                <span>Modèle de chat</span>
                <input
                  type="text"
                  value={chatModel}
                  onChange={(event) => setChatModel(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Modèle d'embedding</span>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(event) => setEmbeddingModel(event.target.value)}
                />
              </label>
            </div>

            <button className="primary-button" disabled={isConfiguring} type="submit">
              {isConfiguring ? "Configuration..." : "Configurer le backend"}
            </button>
          </form>

          <p className="hint-text">
            Les secrets restent en mémoire du processus backend et ne sont pas sauvegardés dans le navigateur.
          </p>

          <div className="status-row">
            <span className={`status-chip ${sessionId ? "is-ready" : ""}`}>
              {sessionId ? "Backend configuré" : "Backend non configuré"}
            </span>
            {configuration ? (
              <span className="status-chip is-neutral">
                {configuration.chatModel} + {configuration.embeddingModel}
              </span>
            ) : null}
          </div>

          <div className="panel-heading panel-heading--spaced">
            <h2>2. Corpus</h2>
            <p>L’indexation crée un namespace Pinecone dédié à cette session.</p>
          </div>

          <label className="field">
            <span>Documents sources</span>
            <textarea
              value={documents}
              onChange={(event) => setDocuments(event.target.value)}
              rows={14}
            />
          </label>

          <button
            className="secondary-button"
            disabled={isIndexing || !sessionId}
            onClick={handleIndex}
            type="button"
          >
            {isIndexing ? "Indexation..." : "Indexer dans Pinecone"}
          </button>

          {indexSummary ? (
            <article className="info-card">
              <p className="answer-label">Indexation active</p>
              <p>Namespace : {indexSummary.namespace}</p>
              <p>Chunks : {indexSummary.chunkCount}</p>
              <p>Embeddings : {indexSummary.embeddingModel}</p>
            </article>
          ) : null}
        </section>

        <form className="panel results-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>3. Question</h2>
            <p>La recherche vectorielle interroge Pinecone, puis le contexte est transmis à OpenAI.</p>
          </div>

          <label className="field">
            <span>Question</span>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? "Génération..." : "Interroger le corpus indexé"}
          </button>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="panel-heading">
            <h2>Résultat</h2>
            <p>La réponse provient du modèle de chat ; les chunks ci-dessous viennent de Pinecone.</p>
          </div>

          <article className="answer-card">
            <p className="answer-label">Réponse</p>
            <p>{result?.answer ?? "Aucune requête envoyée pour le moment."}</p>
            {result ? (
              <div className="status-row">
                <span className="status-chip is-neutral">{result.chatModel}</span>
                <span className="status-chip is-neutral">{result.embeddingModel}</span>
              </div>
            ) : null}
          </article>

          <div className="retrieval-list">
            {(result?.retrievedChunks ?? []).map((chunk) => (
              <article className="retrieval-card" key={chunk.id}>
                <div className="retrieval-meta">
                  <span>Chunk #{chunk.id}</span>
                  <span>Score {chunk.score}</span>
                </div>
                <p>{chunk.content}</p>
              </article>
            ))}

            {!result?.retrievedChunks.length ? (
              <p className="empty-state">
                Les chunks retenus apparaîtront ici après la première requête.
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
