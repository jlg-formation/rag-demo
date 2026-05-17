import { describe, expect, it } from "bun:test";
import { buildSessionCookie, hashPassword } from "./security";
import { createApp } from "./createApp";
import type { GetAuthenticatedUser } from "./api/apiTypes";
import type { DataStore } from "./store";
import type { SessionRecord, UserRecord } from "./types";

const createUser = async (): Promise<UserRecord> => ({
  email: "admin@example.com",
  passwordHash: await hashPassword("secret"),
  displayName: "Admin",
  groups: ["admin"],
  createdAt: "2026-01-01T00:00:00.000Z"
});

const createStoreStub = async () => {
  const user = await createUser();
  const sessions: SessionRecord[] = [];

  return {
    getUsers: () => [user],
    getGroups: () => [{ name: "admin", createdAt: "2026-01-01T00:00:00.000Z" }],
    getDocuments: () => [],
    getRagSettings: () => null,
    getUserByEmail: (email: string) => (email === user.email ? user : null),
    createSession: async (userEmail: string) => {
      const session = {
        id: `session-${sessions.length + 1}`,
        userEmail,
        createdAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2099-01-01T00:00:00.000Z"
      } satisfies SessionRecord;
      sessions.push(session);
      return session;
    },
    deleteSession: async (sessionId: string) => {
      const index = sessions.findIndex((session) => session.id === sessionId);
      if (index >= 0) {
        sessions.splice(index, 1);
      }
    }
  } as unknown as DataStore;
};

const createJsonRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

describe("createApp", () => {
  it("exposes the health endpoint without opening a server port", async () => {
    const app = createApp({ store: await createStoreStub() });

    const response = await app.handle(
      new Request("http://localhost/api/health")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      users: 1,
      groups: 1,
      documents: 0,
      ragConfigured: false
    });
  });

  it("returns 401 on /api/auth/me when no user is injected", async () => {
    const getAuthenticatedUser: GetAuthenticatedUser = async () => null;
    const app = createApp({
      store: await createStoreStub(),
      getAuthenticatedUser
    });

    const response = await app.handle(
      new Request("http://localhost/api/auth/me")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentification requise."
    });
  });

  it("returns the current user on /api/auth/me when auth is injected", async () => {
    const user = await createUser();
    const getAuthenticatedUser: GetAuthenticatedUser = async () => ({
      session: {
        id: "session-1",
        userEmail: user.email,
        createdAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2099-01-01T00:00:00.000Z"
      },
      user,
      isAdmin: true
    });
    const app = createApp({
      store: await createStoreStub(),
      getAuthenticatedUser
    });

    const response = await app.handle(
      new Request("http://localhost/api/auth/me")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        email: user.email,
        displayName: user.displayName,
        groups: user.groups,
        isAdmin: true,
        createdAt: user.createdAt
      },
      ragConfig: {
        configured: false,
        openAiApiKeyConfigured: false,
        openAiApiKeyLast4: null,
        pineconeApiKeyConfigured: false,
        pineconeApiKeyLast4: null,
        pineconeIndex: null,
        pineconeHost: null,
        embeddingModel: null,
        chatModel: null,
        chunkMode: "characters",
        chunkSize: 1000,
        chunkOverlap: 200,
        chunkStride: 800,
        updatedAt: null,
        updatedBy: null,
        namespace: null
      }
    });
  });

  it("creates a session cookie on successful login", async () => {
    const app = createApp({ store: await createStoreStub() });

    const response = await app.handle(
      createJsonRequest("http://localhost/api/auth/login", {
        email: "admin@example.com",
        password: "secret"
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("rag_demo_session=");
    const body = await response.json();
    expect(body.user.email).toBe("admin@example.com");
  });

  it("expires the session cookie on logout", async () => {
    const app = createApp({ store: await createStoreStub() });

    const response = await app.handle(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: buildSessionCookie("session-1")
        }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await response.json()).toEqual({ ok: true });
  });
});
