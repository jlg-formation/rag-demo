import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "rag_demo_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "rag-demo-session-secret-change-me";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const createSignature = (value: string) =>
  createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");

const splitCookiePair = (cookie: string) => {
  const separatorIndex = cookie.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).trim();
  return { key, value };
};

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const isSpinalCase = (value: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const hashPassword = async (password: string) =>
  Bun.password.hash(password);

export const verifyPassword = async (password: string, passwordHash: string) =>
  Bun.password.verify(password, passwordHash);

export const buildSessionCookie = (sessionId: string) => {
  const signature = createSignature(sessionId);
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);

  return `${COOKIE_NAME}=${sessionId}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
};

export const buildExpiredSessionCookie = () =>
  `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

export const getSessionIdFromCookieHeader = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return null;
  }

  const cookieValue = cookieHeader
    .split(";")
    .map((cookie) => splitCookiePair(cookie))
    .find((cookie) => cookie?.key === COOKIE_NAME)?.value;

  if (!cookieValue) {
    return null;
  }

  const lastDotIndex = cookieValue.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return null;
  }

  const sessionId = cookieValue.slice(0, lastDotIndex);
  const signature = cookieValue.slice(lastDotIndex + 1);
  const expectedSignature = createSignature(sessionId);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer) ? sessionId : null;
};
