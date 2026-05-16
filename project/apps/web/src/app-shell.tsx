import { FormEvent, useEffect, useState } from "react";
import {
  FaArrowRightFromBracket,
  FaArrowRightToBracket,
  FaBars,
  FaCircleCheck,
  FaEye,
  FaEyeSlash,
  FaFileLines,
  FaKey,
  FaLayerGroup,
  FaShieldHalved,
  FaTriangleExclamation,
  FaUser,
  FaXmark
} from "react-icons/fa6";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
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
  const location = useLocation();
  const navigationItems = getNavigationItems(user.isAdmin);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen bg-transparent">
      <div
        aria-hidden={!isSidebarOpen}
        className={[
          "fixed inset-0 z-30 bg-ink-950/28 backdrop-blur-[2px] transition-opacity duration-200 ease-out lg:hidden",
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        ].join(" ")}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-stroke-softer bg-[linear-gradient(180deg,rgba(255,249,239,0.96),rgba(243,247,251,0.96))] shadow-[0_22px_60px_rgba(20,48,74,0.14)] backdrop-blur-xl transition-[width,transform] duration-250 ease-out lg:sticky lg:top-0 lg:z-10 lg:translate-x-0 lg:shadow-none",
          "w-80",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-4 lg:px-5">
          <div className="min-w-0 max-w-full opacity-100 transition-all duration-200">
            <Eyebrow className="sidebar-kicker whitespace-nowrap">
              RAG Demo
            </Eyebrow>
          </div>

          <div className="flex items-center gap-2">
            <Button
              aria-label="Fermer le menu"
              className="h-11 w-11 shrink-0 rounded-full p-0 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <FaXmark />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4 lg:px-4">
          <div className="rounded-panel border border-stroke-soft bg-white/48 px-4 py-4 transition-all duration-200">
            <div className="transition-all duration-200">
              <h1 className="m-0 text-[2.05rem] leading-[0.95]">
                Console d’accès
              </h1>
              <p className="mt-2 text-sm text-ink-700">
                Les groupes contrôlent à la fois l’indexation, la liste des
                documents et les passages autorisés dans le prompt.
              </p>
            </div>
          </div>

          <nav className="grid gap-2">
            {navigationItems.map((item) => (
              <NavLink
                aria-label={item.label}
                className={({ isActive }) =>
                  [
                    "group flex items-center rounded-control font-bold transition duration-150 ease-out",
                    "gap-3 px-4 py-3.5",
                    isActive
                      ? "bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-[0_14px_24px_rgba(216,95,61,0.18)]"
                      : "bg-ink-950/5 text-ink-900 hover:bg-ink-950/8"
                  ].join(" ")
                }
                end
                key={item.to}
                to={item.to}
              >
                <span className="flex h-6 w-6 items-center justify-center text-[1rem]">
                  <item.icon />
                </span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <Panel className="mt-auto p-4.5 transition-all duration-200">
            <div className="space-y-2">
              <p className="answer-label">Session</p>
              <p className="meta-line">
                <FaUser />
                <span className="truncate">
                  {user.displayName || user.email}
                </span>
              </p>
              <p className="muted-text meta-line">
                <FaLayerGroup />
                <span className="truncate">{user.groups.join(", ")}</span>
              </p>
              <div className="status-row compact-row">
                <StatusChip
                  tone={ragConfig.configured ? "ready" : "default"}
                  title={
                    ragConfig.configured ? "RAG configuré" : "RAG non configuré"
                  }
                >
                  {ragConfig.configured ? (
                    <FaCircleCheck />
                  ) : (
                    <FaTriangleExclamation />
                  )}
                  <span>
                    {ragConfig.configured
                      ? "RAG configuré"
                      : "RAG non configuré"}
                  </span>
                </StatusChip>
              </div>
            </div>
          </Panel>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-6 max-[640px]:p-4.5">
        <header className="mb-5 flex items-center justify-between gap-4 max-[920px]:flex-col max-[920px]:items-start">
          <div>
            <div className="mb-3 flex items-center gap-3 lg:hidden">
              <Button
                aria-label="Ouvrir le menu"
                className="h-11 w-11 rounded-full p-0"
                onClick={() => setIsSidebarOpen(true)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <FaBars />
              </Button>
              <Eyebrow>Navigation</Eyebrow>
            </div>
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
