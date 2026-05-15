import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import type { IconType } from "react-icons";
import {
  FaArrowRightFromBracket,
  FaArrowRightToBracket,
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
  FaPlus,
  FaShieldHalved,
  FaTrashCan,
  FaTriangleExclamation,
  FaUser,
  FaUsers,
  FaWandSparkles
} from "react-icons/fa6";
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

type UploadedDocumentsPayload = {
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

const ACCEPTED_DOCUMENT_EXTENSIONS = [".txt", ".md", ".markdown"];
const ACCEPTED_DOCUMENT_INPUT = ".txt,.md,.markdown,text/plain,text/markdown";

const isAcceptedDocumentFile = (file: File) =>
  ACCEPTED_DOCUMENT_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );

const getDocumentTitleFromFileName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "") || fileName;

const buildDocumentFileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} o`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} Ko`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

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
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
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
  const [showPassword, setShowPassword] = useState(false);
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
          <span>
            <FaArrowRightToBracket />
            Login
          </span>
          <span>
            <FaLayerGroup />
            Groupes
          </span>
          <span>
            <FaFileLines />
            Documents
          </span>
          <span>
            <FaShieldHalved />
            RAG filtré
          </span>
        </div>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaKey />
            <span>Connexion</span>
          </h2>
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
          <div className="secret-field">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="toggle-visibility-button"
              onClick={() => setShowPassword((current) => !current)}
              title={showPassword ? "Masquer" : "Afficher"}
              type="button"
            >
              <span className="button-content button-content--compact">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
                <span>{showPassword ? "Masquer" : "Afficher"}</span>
              </span>
            </button>
          </div>
        </label>

        <button
          className="primary-button"
          disabled={isSubmitting}
          type="submit"
        >
          <span className="button-content">
            <FaArrowRightToBracket />
            <span>{isSubmitting ? "Connexion…" : "Se connecter"}</span>
          </span>
        </button>

        {error ? (
          <p className="error-banner banner-with-icon">
            <FaTriangleExclamation />
            <span>{error}</span>
          </p>
        ) : null}
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
    { to: "/app/rag", label: "Question RAG", icon: FaWandSparkles },
    ...(user.isAdmin
      ? [
          {
            to: "/app/rag/configuration",
            label: "Config RAG",
            icon: FaGear
          }
        ]
      : []),
    { to: "/app/documents", label: "Documents", icon: FaFileLines },
    { to: "/app/documents/indexer", label: "Indexer", icon: FaPlus },
    ...(user.isAdmin
      ? [
          { to: "/app/groups", label: "Groupes", icon: FaLayerGroup },
          { to: "/app/users", label: "Utilisateurs", icon: FaUsers }
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
              end
              key={item.to}
              to={item.to}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="answer-label">Session</p>
          <p className="meta-line">
            <FaUser />
            <span>{user.displayName || user.email}</span>
          </p>
          <p className="muted-text meta-line">
            <FaLayerGroup />
            <span>{user.groups.join(", ")}</span>
          </p>
          <div className="status-row compact-row">
            <span
              className={`status-chip ${ragConfig.configured ? "is-ready" : ""}`}
            >
              {ragConfig.configured ? (
                <FaCircleCheck />
              ) : (
                <FaTriangleExclamation />
              )}
              {ragConfig.configured ? "RAG configuré" : "RAG non configuré"}
            </span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Mode connecté</p>
            <h2 className="heading-with-icon">
              <FaShieldHalved />
              <span>
                {user.isAdmin
                  ? "Administration et recherche"
                  : "Recherche sécurisée"}
              </span>
            </h2>
          </div>

          <button
            className="ghost-button"
            onClick={() => void logout()}
            type="button"
          >
            <span className="button-content">
              <FaArrowRightFromBracket />
              <span>Déconnexion</span>
            </span>
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

function RagConfigurationPage() {
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
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaGear />
            <span>Configuration du backend RAG</span>
          </h2>
          <p>
            Configuration globale utilisée par l’indexation, la suppression des
            vecteurs et la génération finale.
          </p>
        </div>

        <div className="status-grid">
          <article className="info-card">
            <p className="answer-label info-line">
              <FaCircleCheck />
              <span>État</span>
            </p>
            <p>{ragConfig.configured ? "Configuré" : "Non configuré"}</p>
            <p className="muted-text meta-line">
              <FaShieldHalved />
              <span>Namespace : {ragConfig.namespace || "rag-demo"}</span>
            </p>
          </article>
          <article className="info-card">
            <p className="answer-label info-line">
              <FaDatabase />
              <span>Index Pinecone</span>
            </p>
            <p>{ragConfig.pineconeIndex || "-"}</p>
            <p className="muted-text meta-line">
              <FaClock />
              <span>Mis à jour : {formatDateTime(ragConfig.updatedAt)}</span>
            </p>
          </article>
        </div>

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
                  aria-label={
                    showOpenAiApiKey
                      ? "Masquer la clé OpenAI"
                      : "Afficher la clé OpenAI"
                  }
                  className="toggle-visibility-button"
                  onClick={() => setShowOpenAiApiKey((current) => !current)}
                  title={showOpenAiApiKey ? "Masquer" : "Afficher"}
                  type="button"
                >
                  <span className="button-content button-content--compact">
                    {showOpenAiApiKey ? <FaEyeSlash /> : <FaEye />}
                    <span>{showOpenAiApiKey ? "Masquer" : "Afficher"}</span>
                  </span>
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
                  aria-label={
                    showPineconeApiKey
                      ? "Masquer la clé Pinecone"
                      : "Afficher la clé Pinecone"
                  }
                  className="toggle-visibility-button"
                  onClick={() => setShowPineconeApiKey((current) => !current)}
                  title={showPineconeApiKey ? "Masquer" : "Afficher"}
                  type="button"
                >
                  <span className="button-content button-content--compact">
                    {showPineconeApiKey ? <FaEyeSlash /> : <FaEye />}
                    <span>{showPineconeApiKey ? "Masquer" : "Afficher"}</span>
                  </span>
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
            <span className="button-content">
              <FaGear />
              <span>
                {isConfiguring
                  ? "Enregistrement…"
                  : "Configurer le backend RAG"}
              </span>
            </span>
          </button>
        </form>

        {message ? (
          <p className="success-banner banner-with-icon">
            <FaCircleCheck />
            <span>{message}</span>
          </p>
        ) : null}
        {error ? (
          <p className="error-banner banner-with-icon">
            <FaTriangleExclamation />
            <span>{error}</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}

function RagQuestionPage() {
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
        <p className="hint-text banner-with-icon">
          <FaShieldHalved />
          <span>
            Le backend RAG doit être configuré avant toute interrogation.
          </span>
        </p>
      ) : null}
      {error ? (
        <p className="error-banner banner-with-icon">
          <FaTriangleExclamation />
          <span>{error}</span>
        </p>
      ) : null}

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaMagnifyingGlass />
            <span>Question RAG</span>
          </h2>
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
            <span className="button-content">
              <FaWandSparkles />
              <span>
                {isQuerying
                  ? "Interrogation…"
                  : "Interroger les documents autorisés"}
              </span>
            </span>
          </button>
        </form>

        <article className="answer-card">
          <p className="answer-label info-line">
            <FaWandSparkles />
            <span>Réponse</span>
          </p>
          <p>{result?.answer || "Aucune requête envoyée."}</p>
        </article>

        <div className="retrieval-list">
          {(result?.retrievedChunks || []).map((chunk) => (
            <article
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
            </article>
          ))}

          {!result?.retrievedChunks.length ? (
            <p className="empty-state banner-with-icon">
              <FaMagnifyingGlass />
              <span>
                Les passages récupérés apparaîtront ici après la première
                question.
              </span>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DocumentIndexPage() {
  const { user, ragConfig, resetAuth } = useDashboardContext();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("Politique RAG d’équipe");
  const [group, setGroup] = useState("");
  const [sourceText, setSourceText] = useState(sampleDocument);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      resetAuth();
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      setUploadError(null);
      setPasteError(null);

      try {
        const groupsPayload = await apiRequest<GroupsPayload>("/api/groups");
        setGroups(groupsPayload.groups);
        setGroup((current) => current || groupsPayload.groups[0]?.name || "");
      } catch (error) {
        handleUnauthorized(error);
        const message =
          error instanceof Error ? error.message : "Chargement impossible.";
        setUploadError(message);
        setPasteError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadGroups();
  }, []);

  const appendFiles = (incomingFiles: File[]) => {
    const acceptedFiles = incomingFiles.filter(isAcceptedDocumentFile);
    const rejectedFiles = incomingFiles.filter(
      (file) => !isAcceptedDocumentFile(file)
    );

    setFiles((current) => {
      const nextFiles = new Map(
        current.map((file) => [buildDocumentFileKey(file), file])
      );

      for (const file of acceptedFiles) {
        nextFiles.set(buildDocumentFileKey(file), file);
      }

      return [...nextFiles.values()];
    });

    setUploadMessage(null);
    setUploadError(
      rejectedFiles.length
        ? "Seuls les fichiers .txt, .md et .markdown sont acceptés."
        : null
    );
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files ? [...event.target.files] : [];
    appendFiles(inputFiles);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    appendFiles([...event.dataTransfer.files]);
  };

  const removeFile = (fileKey: string) => {
    setFiles((current) =>
      current.filter((file) => buildDocumentFileKey(file) !== fileKey)
    );
  };

  const handleFileUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploadingFiles(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("group", group);
      for (const file of files) {
        formData.append("files", file);
      }

      const payload = await apiRequest<UploadedDocumentsPayload>(
        "/api/documents/upload",
        {
          method: "POST",
          body: formData
        }
      );
      setUploadMessage(
        `${payload.documents.length} document(s) indexé(s) avec succès.`
      );
      setFiles([]);
    } catch (error) {
      handleUnauthorized(error);
      setUploadError(
        error instanceof Error ? error.message : "Import impossible."
      );
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleTextSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingText(true);
    setPasteError(null);
    setPasteMessage(null);

    try {
      await apiRequest<{ document: DocumentSummary }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({ title, group, sourceText })
      });
      setPasteMessage("Document texte indexé et persisté avec succès.");
      setTitle("");
      setSourceText("");
    } catch (error) {
      handleUnauthorized(error);
      setPasteError(
        error instanceof Error ? error.message : "Indexation impossible."
      );
    } finally {
      setIsSubmittingText(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaPlus />
            <span>Indexer un document</span>
          </h2>
          <p>
            Vous pouvez uniquement indexer un document dans un groupe dont vous
            êtes membre. Groupes actifs : {user.groups.join(", ")}.
          </p>
        </div>

        {isLoading ? (
          <p className="empty-state banner-with-icon">
            <FaClock />
            <span>Chargement des groupes…</span>
          </p>
        ) : null}

        <form className="subpanel" onSubmit={handleFileUpload}>
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

          <div className="field">
            <span>Fichiers source</span>
            <div
              className={`upload-dropzone ${isDragActive ? "is-drag-active" : ""}`}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                accept={ACCEPTED_DOCUMENT_INPUT}
                className="visually-hidden"
                multiple
                onChange={handleFileInputChange}
                ref={fileInputRef}
                type="file"
              />
              <p className="upload-dropzone__title">
                Glissez-déposez un ou plusieurs fichiers texte ou Markdown
              </p>
              <p className="muted-text upload-dropzone__hint">
                Formats acceptés : .txt, .md, .markdown
              </p>
              <button
                className="ghost-button upload-dropzone__button"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <span className="button-content">
                  <FaPlus />
                  <span>Choisir des fichiers</span>
                </span>
              </button>
            </div>
          </div>

          <div className="document-list">
            {files.map((file) => {
              const fileKey = buildDocumentFileKey(file);

              return (
                <article className="document-card compact-card" key={fileKey}>
                  <div className="document-card__header">
                    <div>
                      <h3>{getDocumentTitleFromFileName(file.name)}</h3>
                      <p className="muted-text meta-line meta-line--wrap">
                        <FaFileLines />
                        <span>
                          {file.name} · {formatFileSize(file.size)}
                        </span>
                      </p>
                    </div>

                    <button
                      className="ghost-button danger-button"
                      onClick={() => removeFile(fileKey)}
                      type="button"
                    >
                      <span className="button-content">
                        <FaTrashCan />
                        <span>Retirer</span>
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}

            {!files.length ? (
              <p className="empty-state banner-with-icon">
                <FaFileLines />
                <span>Aucun fichier sélectionné pour l’import multiple.</span>
              </p>
            ) : null}
          </div>

          <button
            className="primary-button"
            disabled={
              isUploadingFiles ||
              !ragConfig.configured ||
              !groups.length ||
              !files.length
            }
            type="submit"
          >
            <span className="button-content">
              <FaFileLines />
              <span>
                {isUploadingFiles
                  ? "Import en cours…"
                  : "Indexer les fichiers sélectionnés"}
              </span>
            </span>
          </button>
        </form>

        {uploadMessage ? (
          <p className="success-banner banner-with-icon">
            <FaCircleCheck />
            <span>{uploadMessage}</span>
          </p>
        ) : null}
        {uploadError ? (
          <p className="error-banner banner-with-icon">
            <FaTriangleExclamation />
            <span>{uploadError}</span>
          </p>
        ) : null}

        <div className="section-divider" />

        <form className="subpanel" onSubmit={handleTextSubmit}>
          <label className="field">
            <span>Nom du document</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
            />
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
            disabled={
              isSubmittingText || !ragConfig.configured || !groups.length
            }
            type="submit"
          >
            <span className="button-content">
              <FaPlus />
              <span>
                {isSubmittingText ? "Indexation…" : "Indexer le texte collé"}
              </span>
            </span>
          </button>
        </form>

        {pasteMessage ? (
          <p className="success-banner banner-with-icon">
            <FaCircleCheck />
            <span>{pasteMessage}</span>
          </p>
        ) : null}
        {pasteError ? (
          <p className="error-banner banner-with-icon">
            <FaTriangleExclamation />
            <span>{pasteError}</span>
          </p>
        ) : null}

        {!ragConfig.configured ? (
          <p className="hint-text banner-with-icon">
            <FaShieldHalved />
            <span>
              Le backend RAG doit être configuré avant toute indexation dans
              Pinecone.
            </span>
          </p>
        ) : null}
      </section>
    </div>
  );
}

function DocumentsListPage() {
  const { resetAuth } = useDashboardContext();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      const documentsPayload =
        await apiRequest<DocumentsPayload>("/api/documents");

      setDocuments(documentsPayload.documents);
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
    <div className="page-grid">
      <section className="panel page-panel">
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaDatabase />
            <span>Documents accessibles</span>
          </h2>
          <p>
            Seuls les documents correspondant à vos groupes apparaissent ici.
          </p>
        </div>

        {isLoading ? (
          <p className="empty-state banner-with-icon">
            <FaClock />
            <span>Chargement des documents…</span>
          </p>
        ) : null}

        <div className="document-list">
          {documents.map((document) => (
            <article className="document-card" key={document.id}>
              <div className="document-card__header">
                <div>
                  <h3>{document.title}</h3>
                  <p className="muted-text meta-line meta-line--wrap">
                    <FaLayerGroup />
                    <span>
                      Groupe {document.group} · {document.chunkCount} chunks ·{" "}
                      {formatDateTime(document.createdAt)}
                    </span>
                  </p>
                </div>

                <button
                  className="ghost-button danger-button"
                  disabled={deletingId === document.id}
                  onClick={() => void handleDelete(document.id)}
                  type="button"
                >
                  <span className="button-content">
                    <FaTrashCan />
                    <span>
                      {deletingId === document.id
                        ? "Suppression…"
                        : "Supprimer"}
                    </span>
                  </span>
                </button>
              </div>

              <p>{document.sourceText}</p>
            </article>
          ))}

          {!isLoading && !documents.length ? (
            <p className="empty-state banner-with-icon">
              <FaFileLines />
              <span>
                Aucun document accessible pour les groupes de l’utilisateur
                connecté.
              </span>
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
          <h2 className="heading-with-icon">
            <FaLayerGroup />
            <span>Créer un groupe</span>
          </h2>
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
            <span className="button-content">
              <FaPlus />
              <span>{isSubmitting ? "Création…" : "Créer le groupe"}</span>
            </span>
          </button>
        </form>

        {message ? (
          <p className="success-banner banner-with-icon">
            <FaCircleCheck />
            <span>{message}</span>
          </p>
        ) : null}
        {error ? (
          <p className="error-banner banner-with-icon">
            <FaTriangleExclamation />
            <span>{error}</span>
          </p>
        ) : null}
      </section>

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaLayerGroup />
            <span>Groupes existants</span>
          </h2>
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
                  <FaClock />
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
  const [showPassword, setShowPassword] = useState(false);
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
          <h2 className="heading-with-icon">
            <FaUser />
            <span>Créer un compte</span>
          </h2>
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
            <div className="secret-field">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe initial"
                    : "Afficher le mot de passe initial"
                }
                className="toggle-visibility-button"
                onClick={() => setShowPassword((current) => !current)}
                title={showPassword ? "Masquer" : "Afficher"}
                type="button"
              >
                <span className="button-content button-content--compact">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                  <span>{showPassword ? "Masquer" : "Afficher"}</span>
                </span>
              </button>
            </div>
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
            <span className="button-content">
              <FaPlus />
              <span>{isSubmitting ? "Création…" : "Créer l’utilisateur"}</span>
            </span>
          </button>
        </form>

        {message ? (
          <p className="success-banner banner-with-icon">
            <FaCircleCheck />
            <span>{message}</span>
          </p>
        ) : null}
        {error ? (
          <p className="error-banner banner-with-icon">
            <FaTriangleExclamation />
            <span>{error}</span>
          </p>
        ) : null}
      </section>

      <section className="panel page-panel">
        <div className="panel-heading">
          <h2 className="heading-with-icon">
            <FaUsers />
            <span>Comptes existants</span>
          </h2>
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
                  {userItem.isAdmin ? <FaShieldHalved /> : <FaUser />}
                  {userItem.isAdmin ? "Admin" : "Utilisateur"}
                </span>
              </div>
              <p className="muted-text meta-line meta-line--wrap">
                <FaLayerGroup />
                <span>Groupes : {userItem.groups.join(", ")}</span>
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
        <Route path="rag" element={<RagQuestionPage />} />
        <Route path="rag/configuration" element={<RagConfigurationPage />} />
        <Route path="documents" element={<DocumentsListPage />} />
        <Route path="documents/indexer" element={<DocumentIndexPage />} />
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
