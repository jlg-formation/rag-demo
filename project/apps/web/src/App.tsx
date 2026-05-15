import { FormEvent, useMemo, useState } from "react";

type QueryResponse = {
  question: string;
  answer: string;
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
  const [documents, setDocuments] = useState(sampleDocuments);
  const [question, setQuestion] = useState(
    "Pourquoi le chunking est-il important dans un RAG ?"
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ documents, question })
      });

      if (!response.ok) {
        throw new Error("La requête a échoué.");
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
        <p className="eyebrow">Démo RAG minimale</p>
        <h1>Visualiser la chaîne complète, sans dépendre d’un LLM externe</h1>
        <p className="hero-copy">
          Saisissez un mini-corpus, posez une question, puis observez la réponse
          et les passages récupérés. Le backend applique un chunking simple, un
          scoring lexical et une synthèse extractive.
        </p>
        <div className="pipeline">
          <span>Ingestion</span>
          <span>Chunking</span>
          <span>Retrieval</span>
          <span>Réponse</span>
        </div>
      </section>

      <section className="workspace-grid">
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>Corpus</h2>
            <p>Quelques paragraphes suffisent pour illustrer le mécanisme.</p>
          </div>

          <label className="field">
            <span>Documents sources</span>
            <textarea
              value={documents}
              onChange={(event) => setDocuments(event.target.value)}
              rows={14}
            />
          </label>

          <label className="field">
            <span>Question</span>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? "Recherche en cours..." : "Interroger le corpus"}
          </button>

          {error ? <p className="error-banner">{error}</p> : null}
        </form>

        <section className="panel results-panel">
          <div className="panel-heading">
            <h2>Résultat</h2>
            <p>La réponse est construite à partir des meilleurs passages.</p>
          </div>

          <article className="answer-card">
            <p className="answer-label">Réponse</p>
            <p>{result?.answer ?? "Aucune requête envoyée pour le moment."}</p>
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
        </section>
      </section>
    </main>
  );
}
