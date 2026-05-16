import { FormEvent, useState } from "react";
import {
  FaArrowRightFromBracket,
  FaArrowRightToBracket,
  FaCircleCheck,
  FaEye,
  FaEyeSlash,
  FaFileLines,
  FaKey,
  FaLayerGroup,
  FaShieldHalved,
  FaTriangleExclamation,
  FaUser
} from "react-icons/fa6";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate
} from "react-router-dom";
import { apiRequest } from "./app-shared";
import type { AuthPayload, DashboardContextValue } from "./app-types";
import { EMPTY_RAG_CONFIG, getNavigationItems } from "./app-shell-config";
import { GroupsPage, UsersPage } from "./pages/admin";
import { DocumentIndexPage, DocumentsListPage } from "./pages/documents";
import { RagConfigurationPage, RagQuestionPage } from "./pages/rag";
import { useAuthSession } from "./use-auth-session";
import {
  Banner,
  Button,
  Eyebrow,
  Field,
  Panel,
  PanelHeading,
  StatusChip,
  TextInput
} from "./components/ui";

function AppShellLoading() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-8">
      <Panel className="w-full max-w-xl">
        <Eyebrow>RAG Demo</Eyebrow>
        <h1>Chargement de la session…</h1>
      </Panel>
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
    <div className="mx-auto grid min-h-screen w-[min(1200px,calc(100%-32px))] grid-cols-[minmax(0,1.1fr)_minmax(340px,420px)] gap-6 px-6 py-6 max-[920px]:grid-cols-1">
      <Panel as="section" className="p-8 max-[640px]:p-4.5">
        <Eyebrow>Multi-tenant RAG</Eyebrow>
        <h1 className="m-0 max-w-[11ch] text-[clamp(2.3rem,5vw,4.8rem)] leading-[0.92] max-[640px]:max-w-none">
          Contrôler qui peut indexer, lire et interroger chaque document.
        </h1>
        <p>
          L’application combine authentification, groupes, persistance JSON,
          filtrage Pinecone et génération OpenAI dans un tableau de bord unique.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
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
      </Panel>

      <Panel
        as="form"
        className="p-8 max-[640px]:p-4.5"
        onSubmit={handleSubmit}
      >
        <PanelHeading
          description="Compte initial de démonstration : admin / admin"
          icon={<FaKey />}
          title="Connexion"
        />

        <Field label="Identifiant">
          <TextInput
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="text"
          />
        </Field>

        <Field label="Mot de passe">
          <div className="secret-field">
            <div className="secret-input-wrap">
              <TextInput
                className="secret-input"
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
                className="secret-visibility-toggle"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </Field>

        <Button disabled={isSubmitting} fullWidth type="submit">
          <FaArrowRightToBracket />
          <span>{isSubmitting ? "Connexion…" : "Se connecter"}</span>
        </Button>

        {error ? (
          <Banner icon={<FaTriangleExclamation />} tone="error">
            {error}
          </Banner>
        ) : null}
      </Panel>
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
  const navigationItems = getNavigationItems(user.isAdmin);

  return (
    <div className="grid min-h-screen grid-cols-[320px_minmax(0,1fr)] max-[1100px]:grid-cols-1">
      <aside className="flex flex-col gap-6 border-r border-stroke-softer bg-[linear-gradient(180deg,rgba(255,249,239,0.92),rgba(243,247,251,0.92))] p-7 max-[1100px]:border-r-0 max-[1100px]:border-b max-[1100px]:border-stroke-softer max-[640px]:p-4.5">
        <div>
          <Eyebrow className="sidebar-kicker">RAG Demo</Eyebrow>
          <h1 className="m-0 text-[2.2rem] leading-[0.95] max-[640px]:max-w-none">
            Console d’accès
          </h1>
          <p className="text-ink-700">
            Les groupes contrôlent à la fois l’indexation, la liste des
            documents et les passages autorisés dans le prompt.
          </p>
        </div>

        <nav className="grid gap-2.5">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-control px-4 py-3.5 font-bold transition duration-150 ease-out",
                  isActive
                    ? "bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-[0_14px_24px_rgba(216,95,61,0.18)]"
                    : "bg-ink-950/5 text-ink-900"
                ].join(" ")
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

        <Panel className="p-4.5">
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
            <StatusChip tone={ragConfig.configured ? "ready" : "default"}>
              {ragConfig.configured ? (
                <FaCircleCheck />
              ) : (
                <FaTriangleExclamation />
              )}
              {ragConfig.configured ? "RAG configuré" : "RAG non configuré"}
            </StatusChip>
          </div>
        </Panel>
      </aside>

      <main className="p-6 max-[640px]:p-4.5">
        <header className="mb-5 flex items-center justify-between gap-4 max-[920px]:flex-col max-[920px]:items-start">
          <div>
            <Eyebrow>Mode connecté</Eyebrow>
            <h2 className="heading-with-icon">
              <FaShieldHalved />
              <span>
                {user.isAdmin
                  ? "Administration et recherche"
                  : "Recherche sécurisée"}
              </span>
            </h2>
          </div>

          <Button onClick={() => void logout()} type="button" variant="ghost">
            <FaArrowRightFromBracket />
            <span>Déconnexion</span>
          </Button>
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

export function AppRoutes() {
  const {
    applyAuthPayload,
    isBooting,
    logout,
    ragConfig,
    resetAuth,
    setRagConfig,
    user
  } = useAuthSession();

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
            <LoginPage onAuthenticated={applyAuthPayload} />
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
