import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { setupInterceptors } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || "");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const saveToken = (token) => {
    setAccessToken(token);
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    saveToken("");
    setUser(null);
  };

  useEffect(() => {
    setupInterceptors({
      getToken: () => tokenRef.current,
      setToken: (t) => saveToken(t),
      onLogout: () => {
        saveToken("");
        setUser(null);
      },
    });

  }, []);

  const loadMe = async () => {
    if (!tokenRef.current) {
      setUser(null);
      return;
    }
    const res = await api.get("/auth/me");
    setUser(res.data.user);
  };

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
          const newToken = r.data.accessToken;
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
    }),
    [accessToken, user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
