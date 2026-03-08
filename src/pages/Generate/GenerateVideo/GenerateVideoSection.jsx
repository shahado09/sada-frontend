import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import ProjectPicker from "../../../components/ProjectPicker/ProjectPicker";
import OutputsGallery from "../../../components/OutputsGallery/OutputsGallery";
import styles from "./GenerateVideoSection.module.css";
import { uploadUpTo3Images } from "../../../services/cloudinaryUpload";

const RATIOS = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
];

const MODELS = [
  { value: "kling-v2-6", label: "Fashion · Creator" },
  { value: "veo3-1-fast", label: "Product · Standard" },
  { value: "veo3-1", label: "Product · High Quality" },
];

function mergeUpTo3(prev, incoming) {
  const map = new Map();
  for (const f of prev) map.set(`${f.name}:${f.size}:${f.lastModified}`, f);
  for (const f of incoming) map.set(`${f.name}:${f.size}:${f.lastModified}`, f);
  return Array.from(map.values()).slice(0, 3);
}

function buildDefaultSelections(template) {
  const sel = {};
  const fields = Array.isArray(template?.fields) ? template.fields : [];
  const options = Array.isArray(template?.options) ? template.options : [];

  for (const f of fields) {
    if (f.type === "select") {
      const list = options.filter((o) => o.key === f.key);
      if (f.allowNone) sel[f.key] = "none";
      else sel[f.key] = list[0]?.value || "";
      continue;
    }
    sel[f.key] = "";
  }

  return sel;
}

function allowedDurations(model) {
  if (model === "kling-v2-6") return [5, 10];
  if (model === "veo3-1-fast") return [4, 6, 8];
  return [];
}

export default function GenerateVideoSection({ category }) {
  const [projectId, setProjectId] = useState("");

  const [kind, setKind] = useState("t2v");
  const [type, setType] = useState("guided");
  const [quality, setQuality] = useState("normal");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const [model, setModel] = useState("kling-v2-6");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [duration, setDuration] = useState(allowedDurations("kling-v2-6")[0] || 0);

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

  const [pendingRequestId, setPendingRequestId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const stopRef = useRef(false);
  const pollTimerRef = useRef(null);

  const cost = useMemo(() => {
    const normal = Number(selectedTemplate?.pricing?.normalCredits ?? 2);
    const high = Number(selectedTemplate?.pricing?.highCredits ?? 4);
    return quality === "high" ? high : normal;
  }, [quality, selectedTemplate]);

  useEffect(() => {
    stopRef.current = false;
    return () => {
      stopRef.current = true;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const list = allowedDurations(model);
    if (!list.length) {
      setDuration(0);
      return;
    }
    if (!list.includes(Number(duration))) setDuration(list[0]);
  }, [model]);

  async function loadTemplates(section, k) {
    try {
      const res = await api.get(`/prompt-templates?section=${section}&kind=${k}&mode=video`);
      setTemplates(res.data || []);
    } catch {
      setTemplates([]);
    }
  }

  useEffect(() => {
    loadTemplates(category, kind);
  }, [category, kind]);

  useEffect(() => {
    if (!templates.length) {
      setTemplateCode("");
      return;
    }
    if (!templateCode || !templates.some((t) => t.code === templateCode)) {
      setTemplateCode(templates[0].code);
    }
  }, [templates, templateCode]);

  useEffect(() => {
    const t = templates.find((x) => x.code === templateCode) || null;
    setSelectedTemplate(t);
    setSelections(t ? buildDefaultSelections(t) : {});
    setExtraPrompt("");
  }, [templateCode, templates]);

  useEffect(() => {
    const urls = (files || []).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    if (kind === "t2v") {
      setFiles([]);
      setPreviews([]);
    }
  }, [kind]);

  function onPickFiles(e) {
    const incoming = Array.from(e.target.files || []);
    setFiles((prev) => mergeUpTo3(prev, incoming));
    e.target.value = "";
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function setFieldValue(key, value) {
    setSelections((p) => ({ ...p, [key]: value }));
  }

  async function runSyncOnce(rid) {
    const res = await api.post(`/requests/${rid}/sync-video`);
    const req = res?.data?.request || null;
    return req;
  }

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  function resolvePending(doneMessage) {
    stopPolling();
    setPendingRequestId("");
    setMsg(doneMessage || "Done");
    setRefreshKey((x) => x + 1);
  }

  function startPollingSyncVideo(rid) {
    stopPolling();

    pollTimerRef.current = setInterval(async () => {
      try {
        if (stopRef.current) return;
        if (!rid) return;

        const req = await runSyncOnce(rid);
        setRefreshKey((x) => x + 1);

        const st = req?.status || "";
        if (st === "completed") {
          resolvePending("Done");
          return;
        }
        if (st === "failed") {
          resolvePending(req?.error || "Failed");
          return;
        }

        setMsg("Processing…");
      } catch (e) {}
    }, 7000);
  }

  async function generate() {
    if (!projectId || busy || pendingRequestId) return;

    setBusy(true);
    setMsg("");

    try {
      const payload = {
        section: category,
        mode: "video",
        kind,
        type,
        quality,
        aspectRatio,
        model,
        generateAudio: !!generateAudio,
      };

      const dlist = allowedDurations(model);
      if (dlist.length) payload.duration = Number(duration);

      if (type === "guided") {
        if (!templateCode) throw new Error("Please select a template");
        payload.templateCode = templateCode;
        payload.selections = selections;
        payload.extraPrompt = extraPrompt;
      } else {
        const p = proPrompt.trim();
        if (!p) throw new Error("Please write a prompt");
        payload.promptText = p;
      }

      if (kind === "i2v") {
        if (!files.length) throw new Error("Please upload at least 1 image");
        const max = model === "veo3-1" ? 3 : 1;
        const picked = files.slice(0, max);
        const uploaded = await uploadUpTo3Images(picked);

        payload.inputs = uploaded.map((x) => ({
          url: x.url,
          publicId: x.publicId,
          resourceType: x.resourceType,
        }));
      }

      const res = await api.post(`/projects/${projectId}/generate-video`, payload);
      const rid = res?.data?.requestId || "";
      if (!rid) throw new Error("Missing requestId");

      setPendingRequestId(rid);
      setMsg("Creating…");
      setRefreshKey((x) => x + 1);

      try {
        const first = await runSyncOnce(rid);
        setRefreshKey((x) => x + 1);

        if (first?.status === "completed") {
          resolvePending("Done");
          return;
        }
        if (first?.status === "failed") {
          resolvePending(first?.error || "Failed");
          return;
        }
      } catch {}

      startPollingSyncVideo(rid);
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
          <div className={styles.cardTitle}>Generate Video</div>

          <div className={styles.row}>
            <button type="button" className={kind === "t2v" ? styles.pillActive : styles.pill} onClick={() => setKind("t2v")} disabled={!!pendingRequestId}>
              Text → Video
            </button>
            <button type="button" className={kind === "i2v" ? styles.pillActive : styles.pill} onClick={() => setKind("i2v")} disabled={!!pendingRequestId}>
              Image → Video
            </button>
          </div>

          <div className={styles.row}>
            <button type="button" className={type === "guided" ? styles.pillActive : styles.pill} onClick={() => setType("guided")} disabled={!!pendingRequestId}>
              Guided
            </button>
            <button type="button" className={type === "pro" ? styles.pillActive : styles.pill} onClick={() => setType("pro")} disabled={!!pendingRequestId}>
              Pro Prompt
            </button>
          </div>

          <div className={styles.row}>
            <button type="button" className={quality === "normal" ? styles.pillActive : styles.pill} onClick={() => setQuality("normal")} disabled={!!pendingRequestId}>
              Normal
            </button>
            <button type="button" className={quality === "high" ? styles.pillActive : styles.pill} onClick={() => setQuality("high")} disabled={!!pendingRequestId}>
              High
            </button>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Model</div>
            <select className={`${styles.select} adminSelectFix`} value={model} onChange={(e) => setModel(e.target.value)} disabled={!!pendingRequestId}>
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Aspect Ratio</div>
            <select className={`${styles.select} adminSelectFix`} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} disabled={!!pendingRequestId}>
              {RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {allowedDurations(model).length > 0 ? (
            <div className={styles.field}>
              <div className={styles.label}>Duration</div>
              <select className={`${styles.select} adminSelectFix`} value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={!!pendingRequestId}>
                {allowedDurations(model).map((d) => (
                  <option key={d} value={d}>
                    {d}s
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.note}>Duration is handled by the model</div>
          )}

          <label className={styles.check}>
            <input type="checkbox" checked={!!generateAudio} onChange={(e) => setGenerateAudio(e.target.checked)} disabled={!!pendingRequestId} />
            <span>Generate Audio</span>
          </label>

          {type === "guided" ? (
            <>
              <div className={styles.field}>
                <div className={styles.label}>Template</div>
                <select
                  className={`${styles.select} adminSelectFix`}
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  disabled={!!pendingRequestId || !templates.length}
                >
                  {templates.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate?.fields?.map((f) => (
                <div className={styles.field} key={f.key}>
                  <div className={styles.label}>{f.label}</div>

                  {f.type === "select" ? (
                    <select
                      className={`${styles.select} adminSelectFix`}
                      value={selections[f.key] ?? (f.allowNone ? "none" : "")}
                      onChange={(e) => setFieldValue(f.key, e.target.value)}
                      disabled={!!pendingRequestId}
                    >
                      {f.allowNone && <option value="none">None</option>}
                      {(selectedTemplate.options || [])
                        .filter((o) => o.key === f.key)
                        .map((o) => (
                          <option key={`${o.key}:${o.value}`} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input className={styles.input} value={selections[f.key] ?? ""} onChange={(e) => setFieldValue(f.key, e.target.value)} disabled={!!pendingRequestId} />
                  )}

                  {f.uiHint ? <div className={styles.hint}>{f.uiHint}</div> : null}
                </div>
              ))}

              <div className={styles.field}>
                <div className={styles.label}>Extra prompt</div>
                <textarea className={styles.textarea} value={extraPrompt} onChange={(e) => setExtraPrompt(e.target.value)} disabled={!!pendingRequestId} />
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <div className={styles.label}>Prompt</div>
              <textarea className={styles.textarea} value={proPrompt} onChange={(e) => setProPrompt(e.target.value)} disabled={!!pendingRequestId} />
            </div>
          )}

          {kind === "i2v" ? (
            <div className={styles.field}>
              <div className={styles.label}>Upload images</div>
              <input className={styles.file} type="file" multiple accept="image/*" onChange={onPickFiles} disabled={!!pendingRequestId} />
              <div className={styles.meta}>{files.length}/3</div>

              {previews.length > 0 ? (
                <div className={styles.previewRow}>
                  {previews.map((src, idx) => (
                    <div key={src} className={styles.previewItem}>
                      <img src={src} alt="" className={styles.previewImg} />
                      <button type="button" onClick={() => removeFile(idx)} className={styles.previewRemove} disabled={!!pendingRequestId}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={generate} disabled={generateDisabled}>
              <span className={styles.btnText}>{pendingRequestId ? "Processing…" : "Generate"}</span>
              <span className={styles.btnMeta}>{cost} credits</span>
            </button>
          </div>

          {msg ? <div className={styles.msg}>{msg}</div> : null}
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
              resolvePending("Done");
            }}
          />
        </div>
      </section>
    </div>
  );
}
