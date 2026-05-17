import { describe, expect, it, mock } from "bun:test";
import { buildSessionCookie } from "../security";
import { createGetAuthenticatedUser } from "./createGetAuthenticatedUser";
import type { DataStore } from "../store";
import type { SessionRecord, UserRecord } from "../types";

const createUser = (groups: string[] = ["patients"]): UserRecord => ({
  email: "alice@example.com",
  passwordHash: "hash",
  displayName: "Alice",
  groups,
  createdAt: "2026-01-01T00:00:00.000Z"
});

const createSession = (): SessionRecord => ({
  id: "session-123",
  userEmail: "alice@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z"
});

const createStoreStub = (overrides?: Partial<Record<string, unknown>>) => {
  return {
    purgeExpiredSessions: mock(async () => {}),
    getSessionById: mock(() => null),
    getUserByEmail: mock(() => null),
    deleteSession: mock(async () => {}),
    ...overrides
  } as unknown as DataStore;
};

describe("createGetAuthenticatedUser", () => {
  it("returns null when the request has no session cookie", async () => {
    const store = createStoreStub();
    const getAuthenticatedUser = createGetAuthenticatedUser(store);

    const result = await getAuthenticatedUser(
      new Request("http://localhost/api/auth/me")
    );

    expect(result).toBeNull();
    expect(store.purgeExpiredSessions).toHaveBeenCalledTimes(1);
  });

  it("returns null when the session is unknown", async () => {
    const session = createSession();
    const store = createStoreStub({
      getSessionById: mock((sessionId: string) =>
        sessionId === session.id ? null : null
      )
    });
    const getAuthenticatedUser = createGetAuthenticatedUser(store);

    const result = await getAuthenticatedUser(
      new Request("http://localhost/api/auth/me", {
        headers: {
          cookie: buildSessionCookie(session.id)
        }
      })
    );

    expect(result).toBeNull();
  });

  it("deletes the session when the user no longer exists", async () => {
    const session = createSession();
    const deleteSession = mock(async () => {});
    const store = createStoreStub({
      getSessionById: mock(() => session),
      deleteSession
    });
    const getAuthenticatedUser = createGetAuthenticatedUser(store);

    const result = await getAuthenticatedUser(
      new Request("http://localhost/api/auth/me", {
        headers: {
          cookie: buildSessionCookie(session.id)
        }
      })
    );

    expect(result).toBeNull();
    expect(deleteSession).toHaveBeenCalledWith(session.id);
  });

  it("returns the authenticated admin user", async () => {
    const session = createSession();
    const user = createUser(["admin", "patients"]);
    const store = createStoreStub({
      getSessionById: mock(() => session),
      getUserByEmail: mock(() => user)
    });
    const getAuthenticatedUser = createGetAuthenticatedUser(store);

    const result = await getAuthenticatedUser(
      new Request("http://localhost/api/auth/me", {
        headers: {
          cookie: buildSessionCookie(session.id)
        }
      })
    );

    expect(result).not.toBeNull();
    expect(result?.session).toEqual(session);
    expect(result?.user).toEqual(user);
    expect(result?.isAdmin).toBe(true);
  });
});
