import { FormEvent, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useOutletContext
} from "react-router-dom";

type UserSummary = {
  email: string;
  displayName: string | null;
  groups: string[];
  isAdmin: boolean;
  createdAt: string;
};

type GroupSummary = {
  name: string;
  createdAt: string;
};

type DocumentSummary = {
  id: string;
  title: string;
  group: string;
  sourceText: string;
  chunkCount: number;
  createdAt: string;
  createdBy: string;
};

type RagConfigSummary = {
  configured: boolean;
  openAiApiKey: string | null;
  pineconeApiKey: string | null;
  pineconeIndex: string | null;
  pineconeHost: string | null;
  embeddingModel: string | null;
  chatModel: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  namespace: string | null;
};

type AuthPayload = {
  user: UserSummary;
  ragConfig: RagConfigSummary;
};

type DocumentsPayload = {
  documents: DocumentSummary[];
};

type GroupsPayload = {
  groups: GroupSummary[];
};

type UsersPayload = {
  users: UserSummary[];
};

type QueryResponse = {
  question: string;
  answer: string;
  ragConfig: RagConfigSummary;
  retrievedChunks: Array<{
    id: number;
    content: string;
    score: number;
    group: string;
    documentId: string;
    title: string;
  }>;
};

type DashboardContextValue = {
  user: UserSummary;
  ragConfig: RagConfigSummary;
  setRagConfig: (value: RagConfigSummary) => void;
  resetAuth: () => void;
  logout: () => Promise<void>;
};

const EMPTY_RAG_CONFIG: RagConfigSummary = {
  configured: false,
  openAiApiKey: null,
  pineconeApiKey: null,
  pineconeIndex: null,
  pineconeHost: null,
  embeddingModel: null,
  chatModel: null,
  updatedAt: null,
  updatedBy: null,
  namespace: null
};

const sampleDocument = `Le Retrieval-Augmented Generation, ou RAG, combine une phase de recherche documentaire et une phase de génération assistée par contexte. Les documents sont découpés en morceaux, vectorisés, puis stockés dans une base adaptée à la recherche sémantique.

Dans cette démonstration, chaque document appartient à un groupe. Le filtrage d'accès doit donc s'appliquer avant même l'étape de génération : on ne doit jamais injecter dans le prompt un chunk provenant d'un groupe auquel l'utilisateur n'appartient pas.

Un bon chunking améliore le rappel et la précision. Si les fragments sont trop petits, le contexte devient pauvre. S'ils sont trop longs, la récupération renvoie des passages moins ciblés.`;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;
  return configuredUrl ? configuredUrl.replace(/\/$/, "") : "";
};

const API_BASE_URL = getApiBaseUrl();

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    }
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as Record<string, unknown>)
    : null;

  if (!response.ok) {
    throw new ApiError(
      String(payload?.error || "La requête a échoué."),
      response.status
    );
  }

  return payload as T;
};

const useDashboardContext = () => useOutletContext<DashboardContextValue>();

function AppShellLoading() {
  return (
    <div className="boot-screen">
      <div className="boot-card">
        <p className="eyebrow">RAG Demo</p>
        <h1>Chargement de la session…</h1>
      </div>
    </div>
  );
}

function LoginPage({
  onAuthenticated
}: {
  onAuthenticated: (payload: AuthPayload) => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await apiRequest<AuthPayload>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onAuthenticated(payload);
      navigate("/app/rag", { replace: true });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Connexion impossible."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Multi-tenant RAG</p>
        <h1>Contrôler qui peut indexer, lire et interroger chaque document.</h1>
        <p>
          L’application combine authentification, groupes, persistance JSON,
          filtrage Pinecone et génération OpenAI dans un tableau de bord unique.
        </p>
        <div className="pipeline">
          <span>Login</span>
          <span>Groupes</span>
          <span>Documents</span>
          <span>RAG filtré</span>
        </div>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <h2>Connexion</h2>
          <p>Compte initial de démonstration : admin / admin</p>
        </div>

        <label className="field">
          <span>Identifiant</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="text"
          />
        </label>

        <label className="field">
          <span>Mot de passe</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
          />
        </label>

        <button
          className="primary-button"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </button>

        {error ? <p className="error-banner">{error}</p> : null}
      </form>
    </div>
  );
}

function DashboardLayout({
  user,
  ragConfig,
  setRagConfig,
  resetAuth,
  logout
}: DashboardContextValue) {
  const navigationItems = [
    { to: "/app/rag", label: "RAG" },
    { to: "/app/documents", label: "Documents" },
    ...(user.isAdmin
      ? [
          { to: "/app/groups", label: "Groupes" },
          { to: "/app/users", label: "Utilisateurs" }
        ]
      : [])
  ];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <p className="sidebar-kicker">RAG Demo</p>
          <h1 className="sidebar-title">Console d’accès</h1>
          <p className="sidebar-text">
            Les groupes contrôlent à la fois l’indexation, la liste des
            documents et les passages autorisés dans le prompt.
          </p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="answer-label">Session</p>
          <p>{user.displayName || user.email}</p>
          <p className="muted-text">{user.groups.join(", ")}</p>
          <div className="status-row compact-row">
            <span
              className={`status-chip ${ragConfig.configured ? "is-ready" : ""}`}
            >
              {ragConfig.configured ? "RAG configuré" : "RAG non configuré"}
            </span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Mode connecté</p>
            <h2>
              {user.isAdmin
                ? "Administration et recherche"
                : "Recherche sécurisée"}
            </h2>
          </div>

          <button
            className="ghost-button"
            onClick={() => void logout()}
            type="button"
          >
            Déconnexion
          </button>
        </header>

        <section className="page-container">
          <Outlet
            context={{ user, ragConfig, setRagConfig, resetAuth, logout }}
          />
        </section>
      </main>
    </div>
  );
}

function RagPage() {
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
  const [question, setQuestion] = useState(
    "Quels groupes limitent l’accès au contexte dans ce RAG ?"
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

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

  const handleQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsQuerying(true);
    setError(null);
    setMessage(null);

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
    <div className="page-grid two-columns">
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Configuration du backend RAG</h2>
          <p>
            Configuration globale utilisée par l’indexation, la suppression des
            vecteurs et la génération finale.
          </p>
        </div>

        <div className="status-grid">
          <article className="info-card">
            <p className="answer-label">État</p>
            <p>{ragConfig.configured ? "Configuré" : "Non configuré"}</p>
            <p className="muted-text">
              Namespace : {ragConfig.namespace || "rag-demo"}
            </p>
          </article>
          <article className="info-card">
            <p className="answer-label">Index Pinecone</p>
            <p>{ragConfig.pineconeIndex || "-"}</p>
            <p className="muted-text">
              Mis à jour : {formatDateTime(ragConfig.updatedAt)}
            </p>
          </article>
        </div>

        {user.isAdmin ? (
          <form className="subpanel" onSubmit={handleConfigure}>
            <div className="config-grid">
              <label className="field">
                <span>Clé OpenAI</span>
                <div className="secret-field">
                  <input
                    type={showOpenAiApiKey ? "text" : "password"}
                    value={openAiApiKey}
                    onChange={(event) => setOpenAiApiKey(event.target.value)}
                  />
                  <button
                    className="toggle-visibility-button"
                    onClick={() => setShowOpenAiApiKey((current) => !current)}
                    type="button"
                  >
                    {showOpenAiApiKey ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Clé Pinecone</span>
                <div className="secret-field">
                  <input
                    type={showPineconeApiKey ? "text" : "password"}
                    value={pineconeApiKey}
                    onChange={(event) => setPineconeApiKey(event.target.value)}
                  />
                  <button
                    className="toggle-visibility-button"
                    onClick={() => setShowPineconeApiKey((current) => !current)}
                    type="button"
                  >
                    {showPineconeApiKey ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Index Pinecone</span>
                <input
                  type="text"
                  value={pineconeIndex}
                  onChange={(event) => setPineconeIndex(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Host Pinecone</span>
                <input
                  type="text"
                  value={pineconeHost}
                  onChange={(event) => setPineconeHost(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Modèle d’embedding</span>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(event) => setEmbeddingModel(event.target.value)}
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
            </div>

            <button
              className="primary-button"
              disabled={isConfiguring}
              type="submit"
            >
              {isConfiguring ? "Enregistrement…" : "Configurer le backend RAG"}
            </button>
          </form>
        ) : (
          <p className="hint-text">
            Seuls les membres du groupe admin peuvent modifier les clés et les
            modèles.
          </p>
        )}

        {message ? <p className="success-banner">{message}</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Question RAG</h2>
          <p>
            La recherche s’effectue uniquement sur les documents dont le groupe
            est autorisé pour l’utilisateur connecté.
          </p>
        </div>

        <form className="subpanel" onSubmit={handleQuery}>
          <label className="field">
            <span>Question</span>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              type="text"
            />
          </label>

          <button
            className="primary-button"
            disabled={isQuerying || !ragConfig.configured}
            type="submit"
          >
            {isQuerying
              ? "Interrogation…"
              : "Interroger les documents autorisés"}
          </button>
        </form>

        <article className="answer-card">
          <p className="answer-label">Réponse</p>
          <p>{result?.answer || "Aucune requête envoyée."}</p>
        </article>

        <div className="retrieval-list">
          {(result?.retrievedChunks || []).map((chunk) => (
            <article
              className="retrieval-card"
              key={`${chunk.documentId}-${chunk.id}`}
            >
              <div className="retrieval-meta">
                <span>{chunk.title}</span>
                <span>Score {chunk.score}</span>
              </div>
              <p className="muted-text">Groupe : {chunk.group}</p>
              <p>{chunk.content}</p>
            </article>
          ))}

          {!result?.retrievedChunks.length ? (
            <p className="empty-state">
              Les passages récupérés apparaîtront ici après la première
              question.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DocumentsPage() {
  const { user, ragConfig, resetAuth } = useDashboardContext();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [title, setTitle] = useState("Politique RAG d’équipe");
  const [group, setGroup] = useState("");
  const [sourceText, setSourceText] = useState(sampleDocument);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      resetAuth();
    }
  };

  const loadPageData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [documentsPayload, groupsPayload] = await Promise.all([
        apiRequest<DocumentsPayload>("/api/documents"),
        apiRequest<GroupsPayload>("/api/groups")
      ]);

      setDocuments(documentsPayload.documents);
      setGroups(groupsPayload.groups);
      setGroup((current) => current || groupsPayload.groups[0]?.name || "");
    } catch (error) {
      handleUnauthorized(error);
      setError(
        error instanceof Error ? error.message : "Chargement impossible."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await apiRequest<{ document: DocumentSummary }>(
        "/api/documents",
        {
          method: "POST",
          body: JSON.stringify({ title, group, sourceText })
        }
      );
      setDocuments((current) => [payload.document, ...current]);
      setMessage("Document indexé et persisté avec succès.");
      setTitle("");
      setSourceText("");
    } catch (error) {
      handleUnauthorized(error);
      setError(
        error instanceof Error ? error.message : "Indexation impossible."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    setError(null);
    setMessage(null);

    try {
      await apiRequest<{ ok: boolean }>(`/api/documents/${documentId}`, {
        method: "DELETE"
      });
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId)
      );
      setMessage("Document supprimé du JSON applicatif et de Pinecone.");
    } catch (error) {
      handleUnauthorized(error);
      setError(
        error instanceof Error ? error.message : "Suppression impossible."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-grid two-columns">
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Indexer un document</h2>
          <p>
            Vous pouvez uniquement indexer un document dans un groupe dont vous
            êtes membre. Groupes actifs : {user.groups.join(", ")}.
          </p>
        </div>

        <form className="subpanel" onSubmit={handleSubmit}>
          <label className="field">
            <span>Titre</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
            />
          </label>

          <label className="field">
            <span>Groupe</span>
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              {groups.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Texte source</span>
            <textarea
              rows={14}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
            />
          </label>

          <button
            className="primary-button"
            disabled={isSubmitting || !ragConfig.configured || !groups.length}
            type="submit"
          >
            {isSubmitting ? "Indexation…" : "Indexer le document"}
          </button>
        </form>

        {!ragConfig.configured ? (
          <p className="hint-text">
            Le backend RAG doit être configuré avant toute indexation dans
            Pinecone.
          </p>
        ) : null}

        {message ? <p className="success-banner">{message}</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Documents accessibles</h2>
          <p>
            Seuls les documents correspondant à vos groupes apparaissent ici.
          </p>
        </div>

        {isLoading ? (
          <p className="empty-state">Chargement des documents…</p>
        ) : null}

        <div className="document-list">
          {documents.map((document) => (
            <article className="document-card" key={document.id}>
              <div className="document-card__header">
                <div>
                  <h3>{document.title}</h3>
                  <p className="muted-text">
                    Groupe {document.group} · {document.chunkCount} chunks ·{" "}
                    {formatDateTime(document.createdAt)}
                  </p>
                </div>

                <button
                  className="ghost-button danger-button"
                  disabled={deletingId === document.id}
                  onClick={() => void handleDelete(document.id)}
                  type="button"
                >
                  {deletingId === document.id ? "Suppression…" : "Supprimer"}
                </button>
              </div>

              <p>{document.sourceText}</p>
            </article>
          ))}

          {!isLoading && !documents.length ? (
            <p className="empty-state">
              Aucun document accessible pour les groupes de l’utilisateur
              connecté.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function GroupsPage() {
  const { user, resetAuth } = useDashboardContext();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const payload = await apiRequest<GroupsPayload>("/api/groups");
        setGroups(payload.groups);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          resetAuth();
          return;
        }
        setError(
          error instanceof Error ? error.message : "Chargement impossible."
        );
      }
    };

    void loadGroups();
  }, []);

  if (!user.isAdmin) {
    return <Navigate replace to="/app/rag" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await apiRequest<{ group: GroupSummary }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name })
      });
      setGroups((current) =>
        [...current, payload.group].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      );
      setMessage("Groupe créé.");
      setName("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        resetAuth();
        return;
      }
      setError(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-grid two-columns">
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Créer un groupe</h2>
          <p>Le nom doit être strictement en spinal-case.</p>
        </div>

        <form className="subpanel" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nom du groupe</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
            />
          </label>

          <button
            className="primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Création…" : "Créer le groupe"}
          </button>
        </form>

        {message ? <p className="success-banner">{message}</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Groupes existants</h2>
          <p>
            Les administrateurs peuvent ensuite rattacher les utilisateurs à ces
            groupes.
          </p>
        </div>

        <div className="document-list">
          {groups.map((groupItem) => (
            <article
              className="document-card compact-card"
              key={groupItem.name}
            >
              <div className="document-card__header">
                <h3>{groupItem.name}</h3>
                <span className="status-chip is-neutral">
                  {formatDateTime(groupItem.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsersPage() {
  const { user, resetAuth } = useDashboardContext();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["admin"]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersPayload, groupsPayload] = await Promise.all([
          apiRequest<UsersPayload>("/api/users"),
          apiRequest<GroupsPayload>("/api/groups")
        ]);
        setUsers(usersPayload.users);
        setGroups(groupsPayload.groups);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          resetAuth();
          return;
        }
        setError(
          error instanceof Error ? error.message : "Chargement impossible."
        );
      }
    };

    void loadData();
  }, []);

  if (!user.isAdmin) {
    return <Navigate replace to="/app/rag" />;
  }

  const toggleGroup = (groupName: string) => {
    setSelectedGroups((current) =>
      current.includes(groupName)
        ? current.filter((value) => value !== groupName)
        : [...current, groupName]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await apiRequest<{ user: UserSummary }>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
          groups: selectedGroups
        })
      });
      setUsers((current) => [payload.user, ...current]);
      setMessage("Compte utilisateur créé.");
      setEmail("");
      setPassword("");
      setDisplayName("");
      setSelectedGroups([]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        resetAuth();
        return;
      }
      setError(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-grid two-columns">
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Créer un compte</h2>
          <p>
            L’identifiant est unique, insensible à la casse, et le mot de passe
            initial est défini par l’admin.
          </p>
        </div>

        <form className="subpanel" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email / identifiant</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="text"
            />
          </label>

          <label className="field">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              type="text"
            />
          </label>

          <label className="field">
            <span>Mot de passe initial</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>

          <div className="field">
            <span>Groupes</span>
            <div className="checkbox-grid">
              {groups.map((groupItem) => (
                <label className="checkbox-card" key={groupItem.name}>
                  <input
                    checked={selectedGroups.includes(groupItem.name)}
                    onChange={() => toggleGroup(groupItem.name)}
                    type="checkbox"
                  />
                  <span>{groupItem.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Création…" : "Créer l’utilisateur"}
          </button>
        </form>

        {message ? <p className="success-banner">{message}</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2>Comptes existants</h2>
          <p>
            Les membres du groupe admin disposent des capacités
            d’administration.
          </p>
        </div>

        <div className="document-list">
          {users.map((userItem) => (
            <article
              className="document-card compact-card"
              key={userItem.email}
            >
              <div className="document-card__header">
                <div>
                  <h3>{userItem.displayName || userItem.email}</h3>
                  <p className="muted-text">{userItem.email}</p>
                </div>
                <span
                  className={`status-chip ${userItem.isAdmin ? "is-ready" : "is-neutral"}`}
                >
                  {userItem.isAdmin ? "Admin" : "Utilisateur"}
                </span>
              </div>
              <p className="muted-text">
                Groupes : {userItem.groups.join(", ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [ragConfig, setRagConfig] =
    useState<RagConfigSummary>(EMPTY_RAG_CONFIG);
  const [isBooting, setIsBooting] = useState(true);

  const resetAuth = () => {
    setUser(null);
    setRagConfig(EMPTY_RAG_CONFIG);
  };

  const logout = async () => {
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } catch {
      // The goal is to clear local state even if the backend session has already expired.
    }

    resetAuth();
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const payload = await apiRequest<AuthPayload>("/api/auth/me");
        setUser(payload.user);
        setRagConfig(payload.ragConfig);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error(error);
        }
        resetAuth();
      } finally {
        setIsBooting(false);
      }
    };

    void bootstrap();
  }, []);

  if (isBooting) {
    return <AppShellLoading />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate replace to="/app/rag" />
          ) : (
            <LoginPage
              onAuthenticated={(payload) => {
                setUser(payload.user);
                setRagConfig(payload.ragConfig);
              }}
            />
          )
        }
      />
      <Route
        path="/app"
        element={
          user ? (
            <DashboardLayout
              logout={logout}
              ragConfig={ragConfig}
              resetAuth={resetAuth}
              setRagConfig={setRagConfig}
              user={user}
            />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      >
        <Route index element={<Navigate replace to="rag" />} />
        <Route path="rag" element={<RagPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate replace to={user ? "/app/rag" : "/login"} />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
