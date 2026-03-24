import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export function setupInterceptors({ getToken, setToken, onLogout }) {
  api.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config;

      if (!err.response || err.response.status !== 401) {
        return Promise.reject(err);
      }

      const isRefreshCall = original?.url?.includes("/auth/refresh");
      if (original?._retry || isRefreshCall) {
        onLogout?.();
        return Promise.reject(err);
      }
      original._retry = true;

      try {
        const r = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = r.data.accessToken;
        if (!newToken) throw new Error("No accessToken returned from refresh");

        setToken?.(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        onLogout?.();
        return Promise.reject(e);
      }
    }
  );
}

export default api;