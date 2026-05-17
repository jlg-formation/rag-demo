import { t } from "elysia";
import {
  buildExpiredSessionCookie,
  buildSessionCookie,
  getSessionIdFromCookieHeader,
  verifyPassword
} from "../../security";
import { toRagSettingsSummary, toUserSummary } from "../apiMappers";
import { badRequest, unauthorized } from "../apiResponses";
import type { AnyElysiaApp, ApiRouteDependencies } from "../apiTypes";

export const registerAuthRoutes = (
  app: AnyElysiaApp,
  { store, getAuthenticatedUser }: ApiRouteDependencies
) =>
  app
    .get("/api/auth/me", async ({ request, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      return {
        user: toUserSummary(auth.user),
        ragConfig: toRagSettingsSummary(store.getRagSettings())
      };
    })
    .post(
      "/api/auth/login",
      async ({ body, set }) => {
        if (!body.email.trim() || !body.password) {
          return badRequest(set, "Les identifiants sont obligatoires.");
        }

        const user = store.getUserByEmail(body.email);
        if (!user) {
          return unauthorized(set, "Identifiants invalides.");
        }

        const isValidPassword = await verifyPassword(
          body.password,
          user.passwordHash
        );
        if (!isValidPassword) {
          return unauthorized(set, "Identifiants invalides.");
        }

        const session = await store.createSession(user.email);
        set.headers["Set-Cookie"] = buildSessionCookie(session.id);

        return {
          user: toUserSummary(user),
          ragConfig: toRagSettingsSummary(store.getRagSettings())
        };
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String()
        })
      }
    )
    .post("/api/auth/logout", async ({ request, set }) => {
      const sessionId = getSessionIdFromCookieHeader(
        request.headers.get("cookie")
      );

      if (sessionId) {
        await store.deleteSession(sessionId);
      }

      set.headers["Set-Cookie"] = buildExpiredSessionCookie();
      return { ok: true };
    });
