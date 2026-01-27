let es = null;

function apiBase() {
  const env = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE;
  if (env) return String(env).replace(/\/$/, "");
  return "http://localhost:3000";
}

export function startSSE({ token, onEvent }) {
  if (!token) return;
  if (es) return;

  const url = `${apiBase()}/api/sse?token=${encodeURIComponent(token)}`;
  es = new EventSource(url);

  const events = [
    "credits",
    "credits.updated",
    "output_created",
    "generation",
    "generation_completed",
    "generation_failed",
    "hello",
    "ping",
  ];

  for (const name of events) {
    es.addEventListener(name, (e) => {
      let data = null;
      try {
        data = e?.data ? JSON.parse(e.data) : null;
      } catch {
        data = null;
      }
      onEvent?.(name, data);
    });
  }

  es.onerror = () => {};
}

export function stopSSE() {
  if (!es) return;
  es.close();
  es = null;
}
