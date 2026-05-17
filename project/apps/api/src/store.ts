import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword, normalizeEmail, SESSION_TTL_MS } from "./security";
import type {
  DocumentRecord,
  GroupRecord,
  RagSettingsRecord,
  SessionRecord,
  UserRecord
} from "./types";

const DEFAULT_ADMIN_EMAIL = normalizeEmail(
  process.env.BOOTSTRAP_ADMIN_EMAIL || "admin"
);
const DEFAULT_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin";
const DEFAULT_ADMIN_DISPLAY_NAME =
  process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME || "Administrator";

const GROUPS_FILE = fileURLToPath(
  new URL("../data/groups.json", import.meta.url)
);
const USERS_FILE = fileURLToPath(
  new URL("../data/users.json", import.meta.url)
);
const SESSIONS_FILE = fileURLToPath(
  new URL("../data/sessions.json", import.meta.url)
);
const DOCUMENTS_FILE = fileURLToPath(
  new URL("../data/documents.json", import.meta.url)
);
const SETTINGS_FILE = fileURLToPath(
  new URL("../data/rag-settings.json", import.meta.url)
);

const sortByCreatedDesc = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const readJsonFile = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents) as T;
  } catch (error) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(fallback, null, 2) + "\n", "utf8");
    return fallback;
  }
};

const writeJsonFile = async (filePath: string, value: unknown) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
};

export class DataStore {
  private groups: GroupRecord[] = [];
  private users: UserRecord[] = [];
  private sessions: SessionRecord[] = [];
  private documents: DocumentRecord[] = [];
  private ragSettings: RagSettingsRecord | null = null;

  static async create() {
    const store = new DataStore();
    await store.load();
    await store.bootstrapDefaults();
    return store;
  }

  private async load() {
    this.groups = await readJsonFile<GroupRecord[]>(GROUPS_FILE, []);
    this.users = await readJsonFile<UserRecord[]>(USERS_FILE, []);
    this.sessions = await readJsonFile<SessionRecord[]>(SESSIONS_FILE, []);
    this.documents = await readJsonFile<DocumentRecord[]>(DOCUMENTS_FILE, []);
    this.ragSettings = await readJsonFile<RagSettingsRecord | null>(
      SETTINGS_FILE,
      null
    );
    await this.purgeExpiredSessions();
  }

  private async bootstrapDefaults() {
    const now = new Date().toISOString();
    const hasAdminGroup = this.groups.some((group) => group.name === "admin");
    if (!hasAdminGroup) {
      this.groups.push({ name: "admin", createdAt: now });
      await this.saveGroups();
    }

    const adminEmail = DEFAULT_ADMIN_EMAIL;
    const adminUser = this.users.find((user) => user.email === adminEmail);

    if (!adminUser) {
      this.users.push({
        email: adminEmail,
        passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
        displayName: DEFAULT_ADMIN_DISPLAY_NAME,
        groups: ["admin"],
        createdAt: now
      });
      await this.saveUsers();
      return;
    }

    if (!adminUser.groups.includes("admin")) {
      adminUser.groups = Array.from(new Set([...adminUser.groups, "admin"]));
      await this.saveUsers();
    }
  }

  private async saveGroups() {
    await writeJsonFile(GROUPS_FILE, this.groups);
  }

  private async saveUsers() {
    await writeJsonFile(USERS_FILE, this.users);
  }

  private async saveSessions() {
    await writeJsonFile(SESSIONS_FILE, this.sessions);
  }

  private async saveDocuments() {
    await writeJsonFile(DOCUMENTS_FILE, this.documents);
  }

  private async saveSettings() {
    await writeJsonFile(SETTINGS_FILE, this.ragSettings);
  }

  async purgeExpiredSessions() {
    const nextSessions = this.sessions.filter(
      (session) => new Date(session.expiresAt).getTime() > Date.now()
    );

    if (nextSessions.length !== this.sessions.length) {
      this.sessions = nextSessions;
      await this.saveSessions();
    }
  }

  getGroups() {
    return [...this.groups].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  hasGroup(groupName: string) {
    return this.groups.some((group) => group.name === groupName);
  }

  async createGroup(name: string) {
    if (this.hasGroup(name)) {
      throw new Error("Ce groupe existe deja.");
    }

    const group = {
      name,
      createdAt: new Date().toISOString()
    } satisfies GroupRecord;

    this.groups.push(group);
    await this.saveGroups();
    return group;
  }

  getUsers() {
    return sortByCreatedDesc(this.users);
  }

  getUserByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    return this.users.find((user) => user.email === normalizedEmail) || null;
  }

  async createUser(input: {
    email: string;
    password: string;
    displayName?: string;
    groups: string[];
  }) {
    const email = normalizeEmail(input.email);
    if (this.getUserByEmail(email)) {
      throw new Error("Un utilisateur avec cet identifiant existe deja.");
    }

    const user = {
      email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName?.trim() || null,
      groups: Array.from(new Set(input.groups)),
      createdAt: new Date().toISOString()
    } satisfies UserRecord;

    this.users.push(user);
    await this.saveUsers();
    return user;
  }

  async createSession(userEmail: string) {
    const session = {
      id: crypto.randomUUID(),
      userEmail,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    } satisfies SessionRecord;

    this.sessions.push(session);
    await this.saveSessions();
    return session;
  }

  getSessionById(sessionId: string) {
    return this.sessions.find((session) => session.id === sessionId) || null;
  }

  async deleteSession(sessionId: string) {
    this.sessions = this.sessions.filter((session) => session.id !== sessionId);
    await this.saveSessions();
  }

  getDocuments() {
    return sortByCreatedDesc(this.documents);
  }

  getDocumentsForGroups(groups: string[]) {
    const allowedGroups = new Set(groups);
    return this.getDocuments().filter((document) =>
      allowedGroups.has(document.group)
    );
  }

  getDocumentById(documentId: string) {
    return (
      this.documents.find((document) => document.id === documentId) || null
    );
  }

  async createDocument(document: DocumentRecord) {
    this.documents.push(document);
    await this.saveDocuments();
    return document;
  }

  async deleteDocument(documentId: string) {
    this.documents = this.documents.filter(
      (document) => document.id !== documentId
    );
    await this.saveDocuments();
  }

  getRagSettings() {
    return this.ragSettings;
  }

  async setRagSettings(settings: RagSettingsRecord) {
    this.ragSettings = settings;
    await this.saveSettings();
    return settings;
  }
}
