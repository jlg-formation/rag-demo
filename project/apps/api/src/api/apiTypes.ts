import type { Elysia } from "elysia";
import type { DataStore } from "../store";
import type { SessionRecord, UserRecord } from "../types";

export type AnyElysiaApp = Elysia<any, any, any, any, any, any, any>;

export type ResponseSet = {
  headers?: Record<string, unknown>;
  status?: number | string;
};

export type AuthenticatedUser = {
  session: SessionRecord;
  user: UserRecord;
  isAdmin: boolean;
};

export type GetAuthenticatedUser = (
  request: Request
) => Promise<AuthenticatedUser | null>;

export type ApiRouteDependencies = {
  store: DataStore;
  getAuthenticatedUser: GetAuthenticatedUser;
};
