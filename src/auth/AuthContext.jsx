import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { setupInterceptors } from "../api/api";
import { startSSE, stopSSE } from "../services/sse";

const AuthContext = createContext(null);

function getTokenFromStorage() {
  return localStorage.getItem("accessToken") || "";
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getTokenFromStorage);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const saveToken = (token) => {
    const t = token ? String(token) : "";
    setAccessToken(t);
    if (t) localStorage.setItem("accessToken", t);
    else localStorage.removeItem("accessToken");
  };

  const loadMe = async () => {
    if (!tokenRef.current) {
      setUser(null);
      return;
    }
    const res = await api.get("/auth/me");
    setUser(res.data.user);
  };

  useEffect(() => {
    setupInterceptors({
      getToken: () => tokenRef.current,
      setToken: (t) => saveToken(t),
      onLogout: () => {
        stopSSE();
        saveToken("");
        setUser(null);
      },
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setAuthLoading(true);

        if (tokenRef.current) {
          await loadMe();
        } else {
          setUser(null);
        }
      } catch {
        try {
          const r = await api.post("/auth/refresh");
          const newToken = r.data?.accessToken || "";
          if (newToken) {
            saveToken(newToken);
            await loadMe();
          } else {
            saveToken("");
            setUser(null);
          }
        } catch {
          saveToken("");
          setUser(null);
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
            setUser((prev) => (prev ? { ...prev, credits } : prev));
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
    setUser(res.data.user);
    return res.data;
  };

  const signup = async ({ email, password, confirmPassword }) => {
    const res = await api.post("/auth/signup", { email, password, confirmPassword });
    saveToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    stopSSE();
    saveToken("");
    setUser(null);
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
      setUser,
    }),
    [accessToken, user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
