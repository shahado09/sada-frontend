import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen]         = useState(false);
  const [title, setTitle]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");

  // ✅ منع double-load في StrictMode
  const didLoad = useRef(false);

  async function load() {
    setErr("");
    try {
      const res = await api.get(`/projects?category=${category}`);
      const list = asArray(res.data);
      setProjects(list);
    } catch (e) {
      setProjects([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load projects");
    }
  }

  useEffect(() => {
    let cancelled = false;

    api.get(`/projects?category=${category}`)
      .then((res) => {
        if (cancelled) return;
        setProjects(asArray(res.data));
        setErr("");
      })
      .catch((e) => {
        if (cancelled) return;
        setProjects([]);
        setErr(e?.response?.data?.message || e.message || "Failed to load");
      });

    return () => { cancelled = true; };
  }, [category]);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await api.post("/projects", { title: title.trim(), category });
      const created = res.data?.project || res.data;
      const newId = created?._id || created?.id || "";

      setOpen(false);
      setTitle("");

      // ✅ أضف المشروع الجديد للقائمة مباشرة بدون reload
      if (created && (created._id || created.id)) {
        setProjects((prev) => [created, ...prev]);
      }

      // ✅ اختر المشروع الجديد فقط إذا عندنا ID صحيح
      if (newId) onChange(newId);

    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && title.trim() && !busy) create();
  }

  // ✅ guard — ما نرسل onChange إلا إذا القيمة تغيرت فعلاً
  function handleSelect(e) {
    const id = e.target.value;
    if (id && id !== value) onChange(id);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <select
          className={styles.select}
          value={value || ""}
          onChange={handleSelect}
        >
          <option value="" disabled>Select project…</option>
          {projects.map((p) => (
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
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Project name"
              autoFocus
            />
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => { setOpen(false); setTitle(""); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy || !title.trim()}
                onClick={create}
              >
                {busy ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
