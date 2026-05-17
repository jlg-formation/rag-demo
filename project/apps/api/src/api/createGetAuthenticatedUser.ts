import { getSessionIdFromCookieHeader } from "../security";
import type { DataStore } from "../store";
import type { GetAuthenticatedUser } from "./apiTypes";

export const createGetAuthenticatedUser = (
  store: DataStore
): GetAuthenticatedUser => {
  return async (request) => {
    await store.purgeExpiredSessions();
    const sessionId = getSessionIdFromCookieHeader(
      request.headers.get("cookie")
    );

    if (!sessionId) {
      return null;
    }

    const session = store.getSessionById(sessionId);
    if (!session) {
      return null;
    }

    const user = store.getUserByEmail(session.userEmail);
    if (!user) {
      await store.deleteSession(session.id);
      return null;
    }

    return {
      session,
      user,
      isAdmin: user.groups.includes("admin")
    };
  };
};
