import { useEffect, useMemo, useState } from "react";
import AdminModal from "../../../components/admin/AdminModal/AdminModal";
import styles from "./AdminPrompts.module.css";
import {
  adminActivatePrompt,
  adminCreatePrompt,
  adminDeactivatePrompt,
  adminListPrompts,
  adminUpdatePrompt,
} from "../../../services/admin/adminPrompts";

const EMPTY_FORM = {
  section: "fashion",
  mode: "image",
  kind: "t2i",
  code: "",
  name: "",
  nameAr: "",
  basePrompt: "",
  fields: [],
  options: [],
  pricing: { normalCredits: 2, highCredits: 4 },
  isActive: true,
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function normKey(v) {
  return String(v || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}
function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function allowedKinds(mode) {
  return mode === "video" ? ["t2v", "i2v"] : ["t2i", "i2i"];
}

// Parse bulk text: "value | Label | Prompt snippet"
function parseBulkOptions(fieldKey, text) {
  return text.split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split("|").map(p => p.trim());
      return {
        key: normKey(fieldKey),
        value: normKey(parts[0] || uid()),
        label: parts[1] || parts[0] || "Option",
        promptSnippet: parts[2] || "",
        isNone: false,
      };
    });
}

export default function AdminPrompts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [filterKind, setFilterKind] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState("basic");
  const [activeFieldKey, setActiveFieldKey] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const data = await adminListPrompts();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return items.filter((x) => {
      if (filterSection !== "all" && x.section !== filterSection) return false;
      if (filterMode !== "all" && (x.mode || "image") !== filterMode) return false;
      if (filterKind !== "all" && x.kind !== filterKind) return false;
      if (filterStatus !== "all") {
        if ((x.isActive ? "active" : "inactive") !== filterStatus) return false;
      }
      return true;
    });
  }, [items, filterSection, filterMode, filterKind, filterStatus]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, pricing: { normalCredits: 2, highCredits: 4 } });
    setTab("basic");
    setActiveFieldKey("");
    setBulkText("");
    setErr("");
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    const fields = Array.isArray(row.fields) ? row.fields : [];
    const mode = row.mode || "image";
    const kinds = allowedKinds(mode);
    const kind = kinds.includes(row.kind) ? row.kind : kinds[0];
    setForm({
      section: row.section || "fashion",
      mode,
      kind,
      code: row.code || "",
      name: row.name || "",
      basePrompt: row.basePrompt || "",
      fields,
      options: Array.isArray(row.options) ? row.options : [],
      pricing: {
        normalCredits: numOr(row?.pricing?.normalCredits, 2),
        highCredits: numOr(row?.pricing?.highCredits, 4),
      },
      isActive: !!row.isActive,
    });
    setTab("basic");
    setActiveFieldKey(fields[0]?.key || "");
    setBulkText("");
    setErr("");
    setOpen(true);
  }

  function closeModal() { if (!saving) setOpen(false); }

  function setBasic(key, value) {
    if (key === "mode") {
      setForm((p) => {
        const kinds = allowedKinds(value);
        return { ...p, mode: value, kind: kinds.includes(p.kind) ? p.kind : kinds[0] };
      });
      return;
    }
    setForm((p) => ({ ...p, [key]: value }));
  }

  function updatePricing(key, value) {
    setForm((p) => ({ ...p, pricing: { ...(p.pricing || {}), [key]: value } }));
  }

  // Fields
  function addField() {
    const key = `field_${uid()}`;
    setForm((p) => ({
      ...p,
      fields: [...(p.fields || []), { key, label: "New Field", type: "select", required: false, allowNone: true, uiHint: "" }],
    }));
    setActiveFieldKey(key);
    setBulkText("");
  }

  function updateField(key, patch) {
    setForm((p) => {
      const next = [...(p.fields || [])];
      const idx = next.findIndex((f) => f.key === key);
      if (idx === -1) return p;
      next[idx] = { ...next[idx], ...patch };
      return { ...p, fields: next };
    });
  }

  function removeField(key) {
    setForm((p) => ({
      ...p,
      fields: (p.fields || []).filter((f) => f.key !== key),
      options: (p.options || []).filter((o) => o.key !== key),
    }));
    const remaining = (form.fields || []).filter((f) => f.key !== key);
    setActiveFieldKey(remaining[0]?.key || "");
  }

  // Options
  function addOption(fieldKey) {
    setForm((p) => ({
      ...p,
      options: [...(p.options || []), { key: fieldKey, value: `opt_${uid()}`, label: "New Option", promptSnippet: "", isNone: false }],
    }));
  }

  function updateOption(fieldKey, value, patch) {
    setForm((p) => {
      const next = [...(p.options || [])];
      const idx = next.findIndex((o) => o.key === fieldKey && o.value === value);
      if (idx === -1) return p;
      next[idx] = { ...next[idx], ...patch };
      return { ...p, options: next };
    });
  }

  function removeOption(fieldKey, value) {
    setForm((p) => ({
      ...p,
      options: (p.options || []).filter((o) => !(o.key === fieldKey && o.value === value)),
    }));
  }

  function importBulk(fieldKey) {
    if (!bulkText.trim()) return;
    const parsed = parseBulkOptions(fieldKey, bulkText);
    setForm((p) => {
      const existing = (p.options || []).filter((o) => o.key !== fieldKey);
      return { ...p, options: [...existing, ...parsed] };
    });
    setBulkText("");
  }

  function validate() {
    if (!form.name.trim()) return "Name is required";
    if (!normKey(form.code)) return "Code is required";
    if (!form.basePrompt.trim()) return "Base prompt is required";
    const keys = new Set();
    for (const f of form.fields || []) {
      const k = normKey(f.key);
      if (!k) return "Each field must have a key";
      if (keys.has(k)) return `Duplicate field key: ${k}`;
      keys.add(k);
    }
    for (const f of form.fields || []) {
      if ((f.type || "select") !== "select") continue;
      const opts = (form.options || []).filter((o) => o.key === f.key);
      if (!opts.length) return `Field "${f.label || f.key}" needs at least 1 option`;
      const vals = new Set();
      for (const o of opts) {
        const v = normKey(o.value);
        if (!v) return `Option value missing in "${f.label}"`;
        if (vals.has(v)) return `Duplicate option "${v}" in "${f.label}"`;
        vals.add(v);
      }
    }
    return "";
  }

  async function save() {
    if (saving) return;
    setErr("");
    const msg = validate();
    if (msg) { setErr(msg); return; }
    const payload = {
      section: form.section,
      mode: form.mode,
      kind: form.kind,
      code: normKey(form.code),
      name: form.name.trim(),
      nameAr: String(form.nameAr || "").trim(),
      basePrompt: form.basePrompt,
      fields: (form.fields || []).map((f) => ({
        key: normKey(f.key),
        label: String(f.label || "").trim(),
        labelAr: String(f.labelAr || "").trim(),
        type: f.type || "select",
        required: !!f.required,
        allowNone: !!f.allowNone,
        uiHint: String(f.uiHint || "").trim(),
      })),
      options: (form.options || []).map((o) => ({
        key: normKey(o.key),
        value: normKey(o.value),
        label: String(o.label || "").trim(),
        labelAr: String(o.labelAr || "").trim(),
        promptSnippet: String(o.promptSnippet || ""),
        isNone: !!o.isNone,
      })),
      pricing: {
        normalCredits: numOr(form.pricing?.normalCredits, 2),
        highCredits: numOr(form.pricing?.highCredits, 4),
      },
      isActive: !!form.isActive,
    };
    setSaving(true);
    try {
      if (editing?._id) {
        const updated = await adminUpdatePrompt(editing._id, payload);
        setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      } else {
        const created = await adminCreatePrompt(payload);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    try {
      const updated = row.isActive ? await adminDeactivatePrompt(row._id) : await adminActivatePrompt(row._id);
      setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Action failed");
    }
  }

  const selectFields = (form.fields || []).filter((f) => (f.type || "select") === "select");
  const activeField = (form.fields || []).find((f) => f.key === activeFieldKey) || null;
  const activeOptions = activeField ? (form.options || []).filter((o) => o.key === activeField.key) : [];

  const filterKindOptions = useMemo(() => {
    if (filterMode === "video") return ["t2v", "i2v"];
    if (filterMode === "image") return ["t2i", "i2i"];
    return ["t2i", "i2i", "t2v", "i2v"];
  }, [filterMode]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Prompts</h1>
          <div className={styles.sub}>Manage prompt templates for all sections</div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={refresh} disabled={loading || saving} type="button">Refresh</button>
          <button className={styles.primaryBtn} onClick={openCreate} disabled={saving} type="button">+ Create Prompt</button>
        </div>
      </div>

      <div className={styles.filters}>
        {[
          { label: "Section", value: filterSection, set: setFilterSection, opts: ["all","fashion","product","creator"] },
          { label: "Mode",    value: filterMode,    set: setFilterMode,    opts: ["all","image","video"] },
          { label: "Status",  value: filterStatus,  set: setFilterStatus,  opts: ["all","active","inactive"] },
        ].map(({ label, value, set, opts }) => (
          <div key={label} className={styles.filterItem}>
            <div className={styles.label}>{label}</div>
            <select className={`${styles.select} adminSelectFix`} value={value} onChange={(e) => set(e.target.value)}>
              {opts.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          </div>
        ))}
        <div className={styles.filterItem}>
          <div className={styles.label}>Kind</div>
          <select className={`${styles.select} adminSelectFix`} value={filterKind} onChange={(e) => setFilterKind(e.target.value)}>
            <option value="all">All</option>
            {filterKindOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className={styles.rightInfo}>{loading ? "Loading..." : `${filtered.length} templates`}</div>
      </div>

      {err && <div className={styles.error}>{err}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Section</th>
              <th>Mode / Kind</th>
              <th>Credits</th>
              <th>Status</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row._id}>
                <td>
                  <div className={styles.name}>{row.name}</div>
                  <div className={styles.mini}>{(row.fields || []).length} fields · {(row.options || []).length} options</div>
                </td>
                <td className={styles.mono}>{row.code}</td>
                <td><span className={styles.badge}>{row.section}</span></td>
                <td>
                  <div className={styles.badges}>
                    <span className={styles.badge}>{row.mode || "image"}</span>
                    <span className={styles.badgeAlt}>{row.kind}</span>
                  </div>
                </td>
                <td className={styles.mono}>{numOr(row?.pricing?.normalCredits, 2)} / {numOr(row?.pricing?.highCredits, 4)}</td>
                <td><span className={row.isActive ? styles.statusActive : styles.statusInactive}>{row.isActive ? "Active" : "Inactive"}</span></td>
                <td className={styles.actions}>
                  <button className={styles.ghostBtn} onClick={() => openEdit(row)} disabled={saving} type="button">Edit</button>
                  <button className={row.isActive ? styles.dangerBtn : styles.successBtn} onClick={() => toggleActive(row)} disabled={saving} type="button">
                    {row.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.empty}>No templates found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal open={open} title={editing ? "Edit Prompt" : "Create Prompt"} onClose={closeModal}>
        <div className={styles.modalTabs}>
          {["basic","fields","options","credits"].map((t) => (
            <button key={t} type="button" className={tab === t ? styles.tabActive : styles.tab} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {err && <div className={styles.errorInModal}>{err}</div>}

        {tab === "basic" && (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.label}>Section</div>
              <select className={`${styles.select} adminSelectFix`} value={form.section} onChange={(e) => setBasic("section", e.target.value)} disabled={saving}>
                {["fashion","product","creator"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <div className={styles.label}>Mode</div>
              <select className={`${styles.select} adminSelectFix`} value={form.mode} onChange={(e) => setBasic("mode", e.target.value)} disabled={saving}>
                <option value="image">image</option>
                <option value="video">video</option>
              </select>
            </div>
            <div className={styles.field}>
              <div className={styles.label}>Kind</div>
              <select className={`${styles.select} adminSelectFix`} value={form.kind} onChange={(e) => setBasic("kind", e.target.value)} disabled={saving}>
                {allowedKinds(form.mode).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <div className={styles.label}>Code {editing && <span className={styles.mini}>(locked)</span>}</div>
              <input className={styles.input} value={form.code} onChange={(e) => setBasic("code", e.target.value)} disabled={saving || !!editing?._id} placeholder="e.g. fashion_model_shoot" />
            </div>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <div className={styles.label}>Name</div>
              <input className={styles.input} value={form.name} onChange={(e) => setBasic("name", e.target.value)} disabled={saving} />
            </div>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <div className={styles.label}>Name (Arabic) — الاسم بالعربي</div>
              <input className={styles.input} value={form.nameAr || ""} onChange={(e) => setBasic("nameAr", e.target.value)} disabled={saving} dir="rtl" placeholder="مثال: تصوير موديل أزياء" />
            </div>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <div className={styles.label}>Base Prompt — use {"{field_key}"} as placeholders</div>
              <textarea className={styles.textarea} value={form.basePrompt} onChange={(e) => setBasic("basePrompt", e.target.value)} disabled={saving} rows={8} />
            </div>
          </div>
        )}

        {tab === "fields" && (
          <div className={styles.builder}>
            <div className={styles.builderLeft}>
              <div className={styles.builderHead}>
                <div className={styles.builderTitle}>Fields</div>
                <button className={styles.primaryBtnSm} onClick={addField} type="button" disabled={saving}>+ Add Field</button>
              </div>
              <div className={styles.fieldList}>
                {(form.fields || []).length === 0 && <div className={styles.mutedBox}>No fields yet</div>}
                {(form.fields || []).map((f) => (
                  <button key={f.key} type="button"
                    className={activeFieldKey === f.key ? styles.fieldItemActive : styles.fieldItem}
                    onClick={() => { setActiveFieldKey(f.key); setBulkText(""); }}>
                    <div className={styles.fieldItemTop}>
                      <span className={styles.fieldItemLabel}>{f.label || f.key}</span>
                      <span className={styles.fieldItemKey}>{normKey(f.key)}</span>
                    </div>
                    <div className={styles.fieldItemMeta}>
                      <span className={styles.pill}>{f.type || "select"}</span>
                      {f.required && <span className={styles.pill}>required</span>}
                      {f.allowNone && <span className={styles.pill}>allow none</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.builderRight}>
              {activeField ? (
                <>
                  <div className={styles.editorHead}>
                    <div>
                      <div className={styles.editorTitle}>{activeField.label || activeField.key}</div>
                      <div className={styles.editorSub}>key: <span className={styles.monoInline}>{normKey(activeField.key)}</span></div>
                    </div>
                    <button className={styles.dangerBtnSm} onClick={() => removeField(activeField.key)} type="button" disabled={saving}>Remove</button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <div className={styles.label}>Key</div>
                      <input className={styles.input} value={activeField.key} onChange={(e) => updateField(activeField.key, { key: e.target.value })} disabled={saving} />
                    </div>
                    <div className={styles.field}>
                      <div className={styles.label}>Type</div>
                      <select className={`${styles.select} adminSelectFix`} value={activeField.type || "select"} onChange={(e) => updateField(activeField.key, { type: e.target.value })} disabled={saving}>
                        <option value="select">select</option>
                        <option value="text">text</option>
                      </select>
                    </div>
                    <div className={`${styles.field} ${styles.fieldWide}`}>
                      <div className={styles.label}>Label (shown to user)</div>
                      <input className={styles.input} value={activeField.label} onChange={(e) => updateField(activeField.key, { label: e.target.value })} disabled={saving} />
                    </div>
                    <div className={`${styles.field} ${styles.fieldWide}`}>
                      <div className={styles.label}>Label (Arabic) — التسمية بالعربي</div>
                      <input className={styles.input} value={activeField.labelAr || ""} onChange={(e) => updateField(activeField.key, { labelAr: e.target.value })} disabled={saving} dir="rtl" placeholder="التسمية بالعربي" />
                    </div>
                    <div className={`${styles.field} ${styles.fieldWide}`}>
                      <div className={styles.label}>UI Hint (optional helper text)</div>
                      <input className={styles.input} value={activeField.uiHint || ""} onChange={(e) => updateField(activeField.key, { uiHint: e.target.value })} disabled={saving} />
                    </div>
                    <div className={styles.checkRow}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" checked={!!activeField.required} onChange={(e) => updateField(activeField.key, { required: e.target.checked })} disabled={saving} />
                        Required
                      </label>
                      <label className={styles.checkbox}>
                        <input type="checkbox" checked={!!activeField.allowNone} onChange={(e) => updateField(activeField.key, { allowNone: e.target.checked })} disabled={saving} />
                        Allow None
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.mutedBox}>Select a field to edit it</div>
              )}
            </div>
          </div>
        )}

        {tab === "options" && (
          <div className={styles.builder}>
            <div className={styles.builderLeft}>
              <div className={styles.builderHead}>
                <div className={styles.builderTitle}>Fields</div>
              </div>
              <div className={styles.fieldList}>
                {selectFields.length === 0 && <div className={styles.mutedBox}>No select fields</div>}
                {selectFields.map((f) => (
                  <button key={f.key} type="button"
                    className={activeFieldKey === f.key ? styles.fieldItemActive : styles.fieldItem}
                    onClick={() => { setActiveFieldKey(f.key); setBulkText(""); }}>
                    <div className={styles.fieldItemTop}>
                      <span className={styles.fieldItemLabel}>{f.label || f.key}</span>
                    </div>
                    <div className={styles.fieldItemMeta}>
                      <span className={styles.pill}>{(form.options || []).filter((o) => o.key === f.key).length} options</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.builderRight}>
              {activeField ? (
                <>
                  <div className={styles.editorHead}>
                    <div>
                      <div className={styles.editorTitle}>{activeField.label}</div>
                      <div className={styles.editorSub}>{activeOptions.length} options</div>
                    </div>
                    <button className={styles.primaryBtnSm} onClick={() => addOption(activeField.key)} type="button" disabled={saving}>+ Add One</button>
                  </div>

                  <div className={styles.bulkBox}>
                    <div className={styles.label}>Bulk Import — one per line: <span className={styles.monoInline}>value | Label | Prompt snippet</span></div>
                    <textarea
                      className={styles.textarea}
                      rows={5}
                      placeholder={"african_female | African Female | A tall African female model...\nkhaleeji_female | Khaleeji Female | A beautiful Khaleeji female model..."}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      disabled={saving}
                    />
                    <button className={styles.primaryBtnSm} onClick={() => importBulk(activeField.key)} type="button" disabled={saving || !bulkText.trim()}>
                      Import & Replace Options
                    </button>
                  </div>

                  {activeOptions.length > 0 && (
                    <div className={styles.optionsTableWrap} style={{ marginTop: 16 }}>
                      <table className={styles.optionsTable}>
                        <thead>
                          <tr>
                            <th>Value</th>
                            <th>Label</th>
                            <th>Label (AR)</th>
                            <th>Prompt Snippet</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOptions.map((o) => (
                            <tr key={`${o.key}:${o.value}`}>
                              <td><input className={styles.inputSm} value={o.value} onChange={(e) => updateOption(activeField.key, o.value, { value: e.target.value })} disabled={saving} /></td>
                              <td><input className={styles.inputSm} value={o.label} onChange={(e) => updateOption(activeField.key, o.value, { label: e.target.value })} disabled={saving} /></td>
                              <td><input className={styles.inputSm} value={o.labelAr || ""} onChange={(e) => updateOption(activeField.key, o.value, { labelAr: e.target.value })} disabled={saving} dir="rtl" placeholder="بالعربي" /></td>
                              <td><textarea className={styles.textareaSm} value={o.promptSnippet || ""} onChange={(e) => updateOption(activeField.key, o.value, { promptSnippet: e.target.value })} disabled={saving} /></td>
                              <td className={styles.center}><button className={styles.dangerBtnSm} onClick={() => removeOption(activeField.key, o.value)} type="button" disabled={saving}>×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.mutedBox}>Select a field to manage its options</div>
              )}
            </div>
          </div>
        )}

        {tab === "credits" && (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.label}>Normal Quality Credits</div>
              <input className={styles.input} type="number" value={form.pricing?.normalCredits ?? 2} onChange={(e) => updatePricing("normalCredits", e.target.value)} disabled={saving} />
            </div>
            <div className={styles.field}>
              <div className={styles.label}>High Quality Credits</div>
              <input className={styles.input} type="number" value={form.pricing?.highCredits ?? 4} onChange={(e) => updatePricing("highCredits", e.target.value)} disabled={saving} />
            </div>
            <div className={styles.checkRow}>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={!!form.isActive} onChange={(e) => setBasic("isActive", e.target.checked)} disabled={saving} />
                Active
              </label>
            </div>
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={closeModal} type="button" disabled={saving}>Cancel</button>
          <button className={styles.primaryBtn} onClick={save} type="button" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </AdminModal>
    </div>
  );
}