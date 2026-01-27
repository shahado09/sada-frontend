import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

import ProjectPicker from "../../components/ProjectPicker/ProjectPicker";
import OutputsGallery from "../../components/OutputsGallery/OutputsGallery";
import styles from "./GenerateImageSection.module.css";
import { uploadUpTo3Images } from "../../services/cloudinaryUpload";

const RATIOS = [
  { value: "1:1", label: "Retro Square (1:1)" },
  { value: "3:2", label: "Retro Print (3:2)" },
  { value: "2:3", label: "Film Portrait (2:3)" },
  { value: "4:5", label: "IG Portrait (4:5)" },
  { value: "9:16", label: "Story (9:16)" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "21:9", label: "Cinematic (21:9)" },
  { value: "3:4", label: "Portrait (3:4)" },
];

export default function GenerateImageSection({ category }) {
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState("t2i");
  const [type, setType] = useState("guided");
  const [quality, setQuality] = useState("normal");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const [templates, setTemplates] = useState([]);
  const [templateCode, setTemplateCode] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [selections, setSelections] = useState({});
  const [extraPrompt, setExtraPrompt] = useState("");
  const [proPrompt, setProPrompt] = useState("");

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const cost = useMemo(() => (quality === "high" ? 4 : 2), [quality]);

  async function loadTemplates() {
    try {
      const res = await api.get(`/prompt-templates?section=${category}&kind=${kind}`);
      setTemplates(res.data || []);
    } catch {
      setTemplates([]);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, [category, kind]);

  useEffect(() => {
    if (!templateCode && templates.length) setTemplateCode(templates[0].code);
    if (!templates.length) setTemplateCode("");
  }, [templates, templateCode]);

  useEffect(() => {
    const t = templates.find((x) => x.code === templateCode) || null;
    setSelectedTemplate(t);
    setSelections({});
  }, [templateCode, templates]);

  useEffect(() => {
    const urls = (files || []).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  function optionsForKey(key) {
    if (!selectedTemplate) return [];
    return (selectedTemplate.options || []).filter((o) => o.key === key);
  }

  function onPickFiles(e) {
    const incoming = Array.from(e.target.files || []);
    const next = incoming.slice(0, 3);
    setFiles(next);
    e.target.value = "";
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function generate() {
    if (!projectId || busy) return;

    setBusy(true);
    setMsg("");

    try {
      const payload = { section: category, kind, type, quality, aspectRatio };

      if (type === "guided") {
        payload.templateCode = templateCode;
        payload.selections = selections;
        payload.extraPrompt = extraPrompt;
      } else {
        payload.promptText = proPrompt.trim();
      }

      if (kind === "i2i") {
        if (!files.length) throw new Error("Please upload at least 1 image");
        const uploaded = await uploadUpTo3Images(files);
        payload.inputs = uploaded.map((x) => ({
          url: x.url,
          publicId: x.publicId,
          resourceType: x.resourceType,
        }));
      }

      const res = await api.post(`/projects/${projectId}/generate`, payload);
      setMsg(`Requested: ${res.data.requestId}`);
      setRefreshKey((x) => x + 1);
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.grid}>
      <aside className={styles.side}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Project</div>
          <ProjectPicker category={category} value={projectId} onChange={setProjectId} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Generate</div>

          <div className={styles.row}>
            <button
              type="button"
              className={kind === "t2i" ? styles.pillActive : styles.pill}
              onClick={() => setKind("t2i")}
            >
              Text → Image
            </button>
            <button
              type="button"
              className={kind === "i2i" ? styles.pillActive : styles.pill}
              onClick={() => setKind("i2i")}
            >
              Image → Image
            </button>
          </div>

          <div className={styles.row}>
            <button
              type="button"
              className={type === "guided" ? styles.pillActive : styles.pill}
              onClick={() => setType("guided")}
            >
              Guided
            </button>
            <button
              type="button"
              className={type === "pro" ? styles.pillActive : styles.pill}
              onClick={() => setType("pro")}
            >
              Pro Prompt
            </button>
          </div>

          <div className={styles.row}>
            <button
              type="button"
              className={quality === "normal" ? styles.pillActive : styles.pill}
              onClick={() => setQuality("normal")}
            >
              Normal
            </button>
            <button
              type="button"
              className={quality === "high" ? styles.pillActive : styles.pill}
              onClick={() => setQuality("high")}
            >
              High
            </button>
          </div>

          <div className={styles.meta}>Cost: {cost} credits</div>

          <div className={styles.field}>
            <div className={styles.label}>Retro size</div>
            <select
              className={styles.select}
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
            >
              {RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {type === "guided" ? (
            <>
              <select
                className={styles.select}
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
                disabled={!templates.length}
              >
                {templates.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>

              {selectedTemplate?.fields?.map((f) => (
                <div className={styles.field} key={f.key}>
                  <div className={styles.label}>{f.label}</div>

                  {f.type === "select" && (
                    <select
                      className={styles.select}
                      value={selections[f.key] || (f.allowNone ? "none" : "")}
                      onChange={(e) =>
                        setSelections((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    >
                      {f.allowNone && <option value="none">None</option>}
                      {optionsForKey(f.key).map((o) => (
                        <option key={`${o.key}:${o.value}`} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {f.type === "text" && (
                    <input
                      className={styles.input}
                      value={selections[f.key] || ""}
                      onChange={(e) =>
                        setSelections((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  )}

                  {f.type === "number" && (
                    <input
                      className={styles.input}
                      type="number"
                      value={selections[f.key] || ""}
                      onChange={(e) =>
                        setSelections((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}

              <div className={styles.field}>
                <div className={styles.label}>Extra prompt</div>
                <textarea
                  className={styles.textarea}
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <div className={styles.label}>Prompt</div>
              <textarea
                className={styles.textarea}
                value={proPrompt}
                onChange={(e) => setProPrompt(e.target.value)}
              />
            </div>
          )}

          {kind === "i2i" && (
            <div className={styles.field}>
              <div className={styles.label}>Upload up to 3 images</div>
              <input
                className={styles.file}
                type="file"
                multiple
                accept="image/*"
                onChange={onPickFiles}
              />

              <div className={styles.meta}>{files.length}/3 selected</div>

              {previews.length > 0 && (
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  {previews.map((src, idx) => (
                    <div
                      key={src}
                      style={{
                        position: "relative",
                        width: 64,
                        height: 64,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.95 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          background: "rgba(0,0,0,0.55)",
                          color: "white",
                          lineHeight: "18px",
                          fontSize: 12,
                        }}
                        aria-label="Remove"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" className={styles.primary} onClick={generate} disabled={!projectId || busy}>
            {busy ? "Generating…" : "Generate"}
          </button>

          {msg && <div className={styles.msg}>{msg}</div>}
        </div>
      </aside>

      <section className={styles.main}>
        <div className={styles.mainCard}>
          <div className={styles.mainTitle}>Outputs</div>
          <OutputsGallery projectId={projectId} refreshKey={refreshKey} />
        </div>
      </section>
    </div>
  );
}
