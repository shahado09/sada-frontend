let controller = null;
let onEventCallback = null;

function apiBase() {
  const env = import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE;}

const SSE_EVENTS = [
  "credits", "credits.updated", "output_created",
  "generation", "generation_completed", "generation_failed",
  "hello", "ping",
];

function parseSSELine(line, currentEvent, currentData) {
  if (line.startsWith("event:")) return { event: line.slice(6).trim(), data: currentData };
  if (line.startsWith("data:")) return { event: currentEvent, data: line.slice(5).trim() };
  return { event: currentEvent, data: currentData };
}

export function startSSE({ token, onEvent }) {
  if (!token) return;
  if (controller) return;

  onEventCallback = onEvent;
  controller = new AbortController();

  const url = `${apiBase()}/api/sse`;

  (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok || !response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";
      let currentData = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line === "") {
            
            if (currentEvent && SSE_EVENTS.includes(currentEvent)) {
              let data = null;
              try { data = currentData ? JSON.parse(currentData) : null; } catch {}
              onEventCallback?.(currentEvent, data);
            }
            currentEvent = "";
            currentData = "";
          } else {
            const parsed = parseSSELine(line, currentEvent, currentData);
            currentEvent = parsed.event;
            currentData = parsed.data;
          }
        }
      }
    } catch (err) {
     
      if (err?.name !== "AbortError") {
        console.error("SSE error:", err);
      }
    }
  })();
}

export function stopSSE() {
  if (!controller) return;
  controller.abort();
  controller = null;
  onEventCallback = null;
}
