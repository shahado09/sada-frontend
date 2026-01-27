import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { setupInterceptors } from "../api/api";
import { startSSE, stopSSE } from "../services/sse";

const AuthContext = createContext(null);

function getTokenFromStorage() {
  return localStorage.getItem("accessToken") || "";
}

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getTokenFromStorage);
  const [user, setUser] = useState(getUserFromStorage);
  const [authLoading, setAuthLoading] = useState(true);

  const tokenRef = useRef(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const saveToken = (token) => {
    const t = token ? String(token) : "";
    tokenRef.current = t;
    setAccessToken(t);
    if (t) localStorage.setItem("accessToken", t);
    else localStorage.removeItem("accessToken");
  };

  const saveUser = (u) => {
    setUser(u);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  const loadMe = async () => {
    if (!tokenRef.current) {
      saveUser(null);
      return;
    }
    const res = await api.get("/auth/me");
    const u = res.data?.user ?? null;
    saveUser(u);
  };

  useEffect(() => {
    setupInterceptors({
      getToken: () => tokenRef.current,
      setToken: (t) => saveToken(t),
      onLogout: () => {
        stopSSE();
        saveToken("");
        saveUser(null);
      },
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      setAuthLoading(true);

      try {
        if (!tokenRef.current) {
          saveUser(null);
          return;
        }
        await loadMe();
      } catch (err) {
        const status = err?.response?.status;

        if (status === 401) {
          try {
            const r = await api.post("/auth/refresh");
            const newToken = r.data?.accessToken || "";
            if (newToken) {
              saveToken(newToken);
              await loadMe();
            } else {
              saveToken("");
              saveUser(null);
            }
          } catch {
            saveToken("");
            saveUser(null);
          }
        }
      } finally {
        setAuthLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      stopSSE();
      return;
    }

    startSSE({
      token: accessToken,
      onEvent: (name, data) => {
        if (name === "credits" || name === "credits.updated") {
          const credits = data?.credits;
          if (typeof credits === "number") {
            setUser((prev) => {
              if (!prev) return prev;
              const next = { ...prev, credits };
              localStorage.setItem("user", JSON.stringify(next));
              return next;
            });
          }
        }

        if (name === "output_created") {
          const projectId = data?.projectId;
          const output = data?.output;
          if (projectId && output) {
            window.dispatchEvent(new CustomEvent("output.created", { detail: { projectId, output } }));
          }
        }
      },
    });

    return () => stopSSE();
  }, [accessToken]);

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    saveToken(res.data.accessToken);
    saveUser(res.data.user ?? null);
    return res.data;
  };

  const signup = async ({ email, password, confirmPassword }) => {
    const res = await api.post("/auth/signup", { email, password, confirmPassword });
    saveToken(res.data.accessToken);
    saveUser(res.data.user ?? null);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    stopSSE();
    saveToken("");
    saveUser(null);
  };

  const value = useMemo(
    () => ({
      accessToken,
      user,
      authLoading,
      isAuthenticated: Boolean(accessToken),
      login,
      signup,
      logout,
      loadMe,
      setUser: saveUser,
    }),
    [accessToken, user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
