import { FormEvent, useEffect, useState } from "react";
import {
  FaCircleCheck,
  FaLayerGroup,
  FaPlus,
  FaTriangleExclamation,
  FaUser,
  FaUsers
} from "react-icons/fa6";
import { Navigate } from "react-router-dom";
import {
  apiRequest,
  ApiError,
  formatDateTime,
  useDashboardContext
} from "../app-shared";
import type {
  GroupSummary,
  GroupsPayload,
  UserSummary,
  UsersPayload
} from "../app-types";
import {
  GroupListCard,
  PasswordVisibilityButton,
  UserListCard
} from "../components/admin";
import {
  Banner,
  Button,
  EmptyState,
  Field,
  Panel,
  PanelHeading,
  TextInput
} from "../components/ui";

export function GroupsPage() {
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
    <div className="grid gap-6 min-[921px]:grid-cols-2">
      <Panel className="page-panel">
        <PanelHeading
          description="Le nom doit être strictement en spinal-case."
          icon={<FaLayerGroup />}
          title="Créer un groupe"
        />

        <form className="subpanel" onSubmit={handleSubmit}>
          <Field label="Nom du groupe">
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
            />
          </Field>

          <Button disabled={isSubmitting} fullWidth type="submit">
            <FaPlus />
            <span>{isSubmitting ? "Création…" : "Créer le groupe"}</span>
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

      <Panel className="page-panel">
        <PanelHeading
          description={
            <>
              Les administrateurs peuvent ensuite rattacher les utilisateurs à
              ces groupes.
            </>
          }
          icon={<FaLayerGroup />}
          title="Groupes existants"
        />

        <div className="document-list">
          {groups.map((groupItem) => (
            <GroupListCard
              createdAtLabel={formatDateTime(groupItem.createdAt)}
              key={groupItem.name}
              name={groupItem.name}
            />
          ))}

          {!groups.length ? (
            <EmptyState icon={<FaLayerGroup />}>
              Aucun groupe disponible pour le moment.
            </EmptyState>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

export function UsersPage() {
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
    <div className="grid gap-6 min-[921px]:grid-cols-2">
      <Panel className="page-panel">
        <PanelHeading
          description={
            <>
              L’identifiant est unique, insensible à la casse, et le mot de
              passe initial est défini par l’admin.
            </>
          }
          icon={<FaUser />}
          title="Créer un compte"
        />

        <form className="subpanel" onSubmit={handleSubmit}>
          <Field label="Email / identifiant">
            <TextInput
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="text"
            />
          </Field>

          <Field label="Display name">
            <TextInput
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              type="text"
            />
          </Field>

          <Field label="Mot de passe initial">
            <div className="secret-field">
              <div className="secret-input-wrap">
                <TextInput
                  className="secret-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                />
                <PasswordVisibilityButton
                  hideLabel="Masquer le mot de passe initial"
                  onToggle={() => setShowPassword((current) => !current)}
                  showLabel="Afficher le mot de passe initial"
                  shown={showPassword}
                />
              </div>
            </div>
          </Field>

          <div className="mt-2 flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink-800">Groupes</span>
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

          <Button disabled={isSubmitting} fullWidth type="submit">
            <FaPlus />
            <span>{isSubmitting ? "Création…" : "Créer l’utilisateur"}</span>
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

      <Panel className="page-panel">
        <PanelHeading
          description={
            <>
              Les membres du groupe admin disposent des capacités
              d’administration.
            </>
          }
          icon={<FaUsers />}
          title="Comptes existants"
        />

        <div className="document-list">
          {users.map((userItem) => (
            <UserListCard
              displayName={userItem.displayName}
              email={userItem.email}
              groups={userItem.groups}
              isAdmin={userItem.isAdmin}
              key={userItem.email}
            />
          ))}

          {!users.length ? (
            <EmptyState icon={<FaUsers />}>
              Aucun compte disponible pour le moment.
            </EmptyState>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
