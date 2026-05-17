import { t } from "elysia";
import { normalizeEmail } from "../../security";
import { toUserSummary } from "../apiMappers";
import {
  badRequest,
  conflict,
  forbidden,
  handleError,
  unauthorized
} from "../apiResponses";
import type { AnyElysiaApp, ApiRouteDependencies } from "../apiTypes";

export const registerUserRoutes = (
  app: AnyElysiaApp,
  { store, getAuthenticatedUser }: ApiRouteDependencies
) =>
  app
    .get("/api/users", async ({ request, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      if (!auth.isAdmin) {
        return forbidden(
          set,
          "Seuls les administrateurs peuvent voir les comptes."
        );
      }

      return {
        users: store.getUsers().map((user) => toUserSummary(user))
      };
    })
    .post(
      "/api/users",
      async ({ request, body, set }) => {
        const auth = await getAuthenticatedUser(request);
        if (!auth) {
          return unauthorized(set);
        }

        if (!auth.isAdmin) {
          return forbidden(
            set,
            "Seuls les administrateurs peuvent creer des comptes."
          );
        }

        if (!body.email.trim() || !body.password) {
          return badRequest(
            set,
            "L'identifiant et le mot de passe sont obligatoires."
          );
        }

        const requestedGroups = body.groups as string[];
        const uniqueGroups = Array.from(new Set(requestedGroups));
        if (!uniqueGroups.length) {
          return badRequest(
            set,
            "Un utilisateur doit appartenir a au moins un groupe."
          );
        }

        if (uniqueGroups.some((group) => !store.hasGroup(group))) {
          return badRequest(
            set,
            "Tous les groupes associes au compte doivent exister."
          );
        }

        try {
          const user = await store.createUser({
            email: normalizeEmail(body.email),
            password: body.password,
            displayName:
              typeof body.displayName === "string"
                ? body.displayName
                : undefined,
            groups: uniqueGroups
          });
          set.status = 201;
          return { user: toUserSummary(user) };
        } catch (error) {
          return conflict(set, handleError(error));
        }
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          displayName: t.Optional(t.String()),
          groups: t.Array(t.String(), { minItems: 1 })
        })
      }
    );
