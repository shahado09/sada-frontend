import { useEffect, useState } from "react";
import api from "../../api/api";
import styles from "./ProjectPicker.module.css";

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export default function ProjectPicker({ category, value, onChange }) {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const res = await api.get(`/projects?category=${category}`);
      setProjects(asArray(res.data));
    } catch (e) {
      setProjects([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load projects");
    }
  }

  useEffect(() => {
    load();
  }, [category]);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await api.post("/projects", { title: title.trim(), category });
      const created = res.data;
      setOpen(false);
      setTitle("");
      await load();
      onChange(created?._id || created?.id || "");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <select className={styles.select} value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Select project…
          </option>

          {Array.isArray(projects) &&
            projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.title || p.name || "Untitled"}
              </option>
            ))}
        </select>

        <button type="button" className={styles.btn} onClick={() => setOpen(true)}>
          New
        </button>
      </div>

      {err && <div className={styles.err}>{err}</div>}

      {open && (
        <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.mTitle}>New Project</div>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name" />
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} disabled={busy || !title.trim()} onClick={create}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
