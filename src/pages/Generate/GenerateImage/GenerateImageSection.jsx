import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../api/api";
import ProjectPicker from "../../../components/ProjectPicker/ProjectPicker";
import OutputsGallery from "../../../components/OutputsGallery/OutputsGallery";
import styles from "./GenerateImageSection.module.css";
import { uploadUpTo3Images } from "../../../services/cloudinaryUpload";

const RATIOS = [
  { value: "1:1",  label: "1:1" },
  { value: "4:5",  label: "4:5" },
  { value: "9:16", label: "9:16" },
  { value: "3:4",  label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "21:9", label: "21:9" },
  { value: "3:2",  label: "3:2" },
  { value: "2:3",  label: "2:3" },
];

function buildDefaultSelections(template) {
  const sel     = {};
  const fields  = Array.isArray(template?.fields)  ? template.fields  : [];
  const options = Array.isArray(template?.options) ? template.options : [];
  for (const f of fields) {
    if (f.type === "select") {
      const list = options.filter((o) => o.key === f.key);
      sel[f.key] = f.allowNone ? "none" : (list[0]?.value ?? "");
    } else {
      sel[f.key] = "";
    }
  }
  return sel;
}

export default function GenerateImageSection({ category }) {
  const [projectId, setProjectId]     = useState("");
  const [kind, setKind]               = useState("t2i");
  const [type, setType]               = useState("guided");
  const [quality, setQuality]         = useState("normal");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const [templates, setTemplates]               = useState([]);
  const [templateCode, setTemplateCode]         = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selections, setSelections]             = useState({});
  const [extraPrompt, setExtraPrompt]           = useState("");
  const [proPrompt, setProPrompt]               = useState("");

  const [files, setFiles]       = useState([]);
  const [previews, setPreviews] = useState([]);

  const [busy, setBusy]                         = useState(false);
  const [msg, setMsg]                           = useState("");
  const [pendingRequestId, setPendingRequestId] = useState("");
  const [refreshKey, setRefreshKey]             = useState(0);

  const [imagePricing, setImagePricing] = useState({ normal: 2, high: 4 });

  const didInit = useRef(false);
  const stopRef = useRef(false);

  useEffect(() => {
    api.get("/pricing/image").then((r) => setImagePricing(r.data?.pricing || { normal: 2, high: 4 })).catch(() => {});
  }, []);

  const costKey = kind === "i2i"
    ? (quality === "high" ? "i2i_high" : "i2i_normal")
    : (quality === "high" ? "t2i_high" : "t2i_normal");
  const cost = imagePricing[costKey] ?? (quality === "high" ? 4 : 2);

  const pollRefreshWhilePending = useCallback(async (rid) => {
    for (let i = 0; i < 80; i++) {
      if (stopRef.current || !rid) return;
      await new Promise((r) => setTimeout(r, 1500));
      setRefreshKey((x) => x + 1);
    }
  }, []);

  useEffect(() => {
    stopRef.current = false;
    if (didInit.current) return;
    didInit.current = true;
    api.get("/generation/active").then((res) => {
      const active = res?.data?.active;
      if (active?.requestId && active?.section === category && (active?.mode === "image" || !active?.mode)) {
        if (active.projectId) setProjectId(String(active.projectId));
        setPendingRequestId(String(active.requestId));
        setMsg("Resuming…");
        setRefreshKey((x) => x + 1);
        pollRefreshWhilePending(active.requestId);
      }
    }).catch(() => {});
    return () => { stopRef.current = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get(`/prompt-templates?section=${category}&kind=${kind}`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setTemplates(list);
        if (list.length > 0) {
          setTemplateCode((prev) => {
            const valid = list.some((t) => t.code === prev);
            return valid ? prev : list[0].code;
          });
        } else {
          setTemplateCode("");
          setSelectedTemplate(null);
          setSelections({});
        }
      })
      .catch(() => {
        if (cancelled) return;
        setTemplates([]);
        setTemplateCode("");
        setSelectedTemplate(null);
        setSelections({});
      });
    return () => { cancelled = true; };
  }, [category, kind]);

  useEffect(() => {
    const t = templates.find((x) => x.code === templateCode) ?? null;
    setSelectedTemplate(t);
    setSelections(t ? buildDefaultSelections(t) : {});
    setExtraPrompt("");
  }, [templateCode, templates]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    if (kind === "t2i") { setFiles([]); setPreviews([]); }
  }, [kind]);

  function onPickFiles(e) {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    setFiles((prev) => {
      const all = [...prev, ...incoming];
      const seen = new Set();
      return all.filter((f) => {
        const key = `${f.name}:${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 3);
    });
    e.target.value = "";
  }

  function removeFile(idx) { setFiles((prev) => prev.filter((_, i) => i !== idx)); }
  function setFieldValue(key, value) { setSelections((p) => ({ ...p, [key]: value })); }

  async function generate() {
    if (!projectId || busy || pendingRequestId) return;
    setBusy(true);
    setMsg("");
    try {
      const payload = { section: category, kind, type, quality, aspectRatio };
      if (type === "guided") {
        if (!templateCode) throw new Error("Please select a template");
        payload.templateCode = templateCode;
        payload.selections   = selections;
        payload.extraPrompt  = extraPrompt;
      } else {
        const p = proPrompt.trim();
        if (!p) throw new Error("Please write a prompt");
        payload.promptText = p;
      }
      if (kind === "i2i") {
        if (!files.length) throw new Error("Please upload at least 1 image");
        const uploaded = await uploadUpTo3Images(files);
        payload.inputs = uploaded.map((x) => ({
          url: x.url, publicId: x.publicId, resourceType: x.resourceType,
        }));
      }
      const res = await api.post(`/projects/${projectId}/generate`, payload);
      const rid = res?.data?.requestId || "";
      if (!rid) throw new Error("Missing requestId");
      setPendingRequestId(rid);
      setMsg("Creating…");
      setRefreshKey((x) => x + 1);
      pollRefreshWhilePending(rid);
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  const generateDisabled = !projectId || busy || !!pendingRequestId;

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
            <button type="button" className={kind === "t2i" ? styles.pillActive : styles.pill}
              onClick={() => setKind("t2i")} disabled={!!pendingRequestId}>Text → Image</button>
            <button type="button" className={kind === "i2i" ? styles.pillActive : styles.pill}
              onClick={() => setKind("i2i")} disabled={!!pendingRequestId}>Image → Image</button>
          </div>

          <div className={styles.row}>
            <button type="button" className={type === "guided" ? styles.pillActive : styles.pill}
              onClick={() => setType("guided")} disabled={!!pendingRequestId}>Guided</button>
            <button type="button" className={type === "pro" ? styles.pillActive : styles.pill}
              onClick={() => setType("pro")} disabled={!!pendingRequestId}>Pro Prompt</button>
          </div>

          <div className={styles.row}>
            <button type="button" className={quality === "normal" ? styles.pillActive : styles.pill}
              onClick={() => setQuality("normal")} disabled={!!pendingRequestId}>Normal</button>
            <button type="button" className={quality === "high" ? styles.pillActive : styles.pill}
              onClick={() => setQuality("high")} disabled={!!pendingRequestId}>High</button>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Format</div>
            <select className={`${styles.select} adminSelectFix`} value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)} disabled={!!pendingRequestId}>
              {RATIOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {type === "guided" ? (
            <>
              <div className={styles.field}>
                <div className={styles.label}>Template</div>
                {templates.length === 0 ? (
                  <div className={styles.msg}>No templates yet — use Pro Prompt mode</div>
                ) : (
                  <select className={`${styles.select} adminSelectFix`} value={templateCode}
                    onChange={(e) => setTemplateCode(e.target.value)} disabled={!!pendingRequestId}>
                    {templates.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
                  </select>
                )}
              </div>

              {(selectedTemplate?.fields ?? []).map((f) => (
                <div key={f.key} className={styles.field}>
                  <div className={styles.label}>{f.label}</div>
                  {f.type === "select" ? (
                    <select className={`${styles.select} adminSelectFix`}
                      value={selections[f.key] ?? ""}
                      onChange={(e) => setFieldValue(f.key, e.target.value)}
                      disabled={!!pendingRequestId}>
                      {f.allowNone && <option value="none">None</option>}
                      {(selectedTemplate.options ?? [])
                        .filter((o) => o.key === f.key)
                        .map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input className={styles.select}
                      value={selections[f.key] ?? ""}
                      onChange={(e) => setFieldValue(f.key, e.target.value)}
                      disabled={!!pendingRequestId} />
                  )}
                </div>
              ))}

              <div className={styles.field}>
                <div className={styles.label}>Extra prompt (optional)</div>
                <textarea className={styles.textarea} value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)} disabled={!!pendingRequestId} />
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <div className={styles.label}>Prompt</div>
              <textarea className={styles.textarea} value={proPrompt}
                onChange={(e) => setProPrompt(e.target.value)} disabled={!!pendingRequestId} />
            </div>
          )}

          {kind === "i2i" && (
            <div className={styles.field}>
              <div className={styles.label}>Upload up to 3 images</div>
              <input
                type="file"
                multiple
                accept="image/*"
                className={styles.file}
                onChange={onPickFiles}
                disabled={!!pendingRequestId}
              />
              <div className={styles.meta}>{files.length}/3</div>
              {previews.length > 0 && (
                <div className={styles.previewRow}>
                  {previews.map((src, idx) => (
                    <div key={src} className={styles.previewItem}>
                      <img src={src} alt="" className={styles.previewImg} />
                      <button type="button" className={styles.previewRemove}
                        onClick={() => removeFile(idx)} disabled={!!pendingRequestId}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={generate} disabled={generateDisabled}>
              <span className={styles.btnText}>{pendingRequestId ? "Creating…" : "Generate"}</span>
              <span className={styles.btnMeta}>{cost} credits</span>
            </button>
          </div>

          {msg && <div className={styles.msg}>{msg}</div>}
        </div>
      </aside>

      <section className={styles.main}>
        <div className={styles.mainCard}>
          <div className={styles.mainTitle}>Outputs</div>
          <OutputsGallery
            projectId={projectId}
            refreshKey={refreshKey}
            pendingRequestId={pendingRequestId}
            onPendingResolved={() => {
              setPendingRequestId("");
              setMsg("Done");
              setRefreshKey((x) => x + 1);
            }}
          />
        </div>
      </section>
    </div>
  );
}