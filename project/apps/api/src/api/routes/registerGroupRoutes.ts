import { t } from "elysia";
import { isSpinalCase } from "../../security";
import {
  badRequest,
  conflict,
  forbidden,
  handleError,
  unauthorized
} from "../apiResponses";
import type { AnyElysiaApp, ApiRouteDependencies } from "../apiTypes";

export const registerGroupRoutes = (
  app: AnyElysiaApp,
  { store, getAuthenticatedUser }: ApiRouteDependencies
) =>
  app
    .get("/api/groups", async ({ request, set }) => {
      const auth = await getAuthenticatedUser(request);
      if (!auth) {
        return unauthorized(set);
      }

      const groups = auth.isAdmin
        ? store.getGroups()
        : store
            .getGroups()
            .filter((group) => auth.user.groups.includes(group.name));

      return { groups };
    })
    .post(
      "/api/groups",
      async ({ request, body, set }) => {
        const auth = await getAuthenticatedUser(request);
        if (!auth) {
          return unauthorized(set);
        }

        if (!auth.isAdmin) {
          return forbidden(
            set,
            "Seuls les administrateurs peuvent creer des groupes."
          );
        }

        if (!body.name.trim()) {
          return badRequest(set, "Le nom du groupe est obligatoire.");
        }

        if (!isSpinalCase(body.name)) {
          return badRequest(
            set,
            "Le nom du groupe doit etre strictement en spinal-case."
          );
        }

        try {
          const group = await store.createGroup(body.name);
          set.status = 201;
          return { group };
        } catch (error) {
          return conflict(set, handleError(error));
        }
      },
      {
        body: t.Object({
          name: t.String()
        })
      }
    );
