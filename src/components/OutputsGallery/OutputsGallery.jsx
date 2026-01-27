import { useEffect, useState } from "react";
import api from "../../api/api";
import styles from "./OutputsGallery.module.css";

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.outputs)) return payload.outputs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function pickUrl(x) {
  return (
    x?.url ||
    x?.secure_url ||
    x?.imageUrl ||
    x?.image_url ||
    x?.resultUrl ||
    x?.result_url ||
    x?.asset?.url ||
    ""
  );
}

export default function OutputsGallery({ projectId, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/projects/${projectId}/outputs`);
      setItems(asArray(res.data));
    } catch (e) {
      setItems([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load outputs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setErr("");
    if (!projectId) return;
    load();
  }, [projectId, refreshKey]);

  if (!projectId) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.title}>Gallery</div>
        <button type="button" className={styles.btn} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className={styles.empty}>{err}</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>No outputs yet</div>
      ) : (
        <div className={styles.grid}>
          {items.map((x) => {
            const url = pickUrl(x);
            if (!url) return null;
            return (
              <a key={x._id || url} className={styles.card} href={url} target="_blank" rel="noreferrer">
                <img className={styles.img} src={url} alt="" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
