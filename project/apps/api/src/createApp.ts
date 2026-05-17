import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { createGetAuthenticatedUser } from "./api/createGetAuthenticatedUser";
import type { GetAuthenticatedUser } from "./api/apiTypes";
import { serveFrontend } from "./api/frontendAssets";
import { registerAuthRoutes } from "./api/routes/registerAuthRoutes";
import { registerDocumentRoutes } from "./api/routes/registerDocumentRoutes";
import { registerGroupRoutes } from "./api/routes/registerGroupRoutes";
import { registerRagRoutes } from "./api/routes/registerRagRoutes";
import { registerUserRoutes } from "./api/routes/registerUserRoutes";
import type { DataStore } from "./store";

type CreateAppOptions = {
  store: DataStore;
  getAuthenticatedUser?: GetAuthenticatedUser;
};

export const createApp = ({
  store,
  getAuthenticatedUser = createGetAuthenticatedUser(store)
}: CreateAppOptions) => {
  const routeDependencies = { store, getAuthenticatedUser };

  const app = new Elysia()
    .use(
      cors({
        origin: true,
        credentials: true
      })
    )
    .get("/api/health", () => ({
      status: "ok",
      users: store.getUsers().length,
      groups: store.getGroups().length,
      documents: store.getDocuments().length,
      ragConfigured: Boolean(store.getRagSettings())
    }));

  registerAuthRoutes(app, routeDependencies);
  registerGroupRoutes(app, routeDependencies);
  registerUserRoutes(app, routeDependencies);
  registerDocumentRoutes(app, routeDependencies);
  registerRagRoutes(app, routeDependencies);

  return app
    .get("/", ({ set }) => serveFrontend("/", set))
    .get("/*", ({ params, set }) => serveFrontend(`/${params["*"]}`, set));
};
