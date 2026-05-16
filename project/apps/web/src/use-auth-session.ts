import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "./app-shared";
import type { AuthPayload, RagConfigSummary, UserSummary } from "./app-types";
import { EMPTY_RAG_CONFIG } from "./app-shell-config";

export function useAuthSession() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [ragConfig, setRagConfig] =
    useState<RagConfigSummary>(EMPTY_RAG_CONFIG);
  const [isBooting, setIsBooting] = useState(true);

  const resetAuth = () => {
    setUser(null);
    setRagConfig(EMPTY_RAG_CONFIG);
  };

  const applyAuthPayload = (payload: AuthPayload) => {
    setUser(payload.user);
    setRagConfig(payload.ragConfig);
  };

  const logout = async () => {
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } catch {}

    resetAuth();
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const payload = await apiRequest<AuthPayload>("/api/auth/me");
        applyAuthPayload(payload);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error(error);
        }
        resetAuth();
      } finally {
        setIsBooting(false);
      }
    };

    void bootstrap();
  }, []);

  return {
    applyAuthPayload,
    isBooting,
    logout,
    ragConfig,
    resetAuth,
    setRagConfig,
    user
  };
}
