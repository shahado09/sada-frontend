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

const emptyForm = {
  section: "fashion",
  mode: "image",
  kind: "t2i",
  code: "",
  name: "",
  basePrompt: "",
  fields: [],
  options: [],
  pricing: { normalCredits: 2, highCredits: 4 },
  isActive: true,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function normKey(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function allowedKinds(mode) {
  return mode === "video" ? ["t2v", "i2v"] : ["t2i", "i2i"];
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
  const [form, setForm] = useState(emptyForm);

  const [tab, setTab] = useState("basic");
  const [activeFieldKey, setActiveFieldKey] = useState("");

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

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((x) => {
      if (filterSection !== "all" && x.section !== filterSection) return false;
      if (filterMode !== "all" && (x.mode || "image") !== filterMode) return false;
      if (filterKind !== "all" && x.kind !== filterKind) return false;
      if (filterStatus !== "all") {
        const s = x.isActive ? "active" : "inactive";
        if (s !== filterStatus) return false;
      }
      return true;
    });
  }, [items, filterSection, filterMode, filterKind, filterStatus]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, pricing: { normalCredits: 2, highCredits: 4 } });
    setTab("basic");
    setActiveFieldKey("");
    setErr("");
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    const f = Array.isArray(row.fields) ? row.fields : [];
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
      fields: f,
      options: Array.isArray(row.options) ? row.options : [],
      pricing: {
        normalCredits: numOr(row?.pricing?.normalCredits, 2),
        highCredits: numOr(row?.pricing?.highCredits, 4),
      },
      isActive: !!row.isActive,
    });

    setTab("basic");
    setActiveFieldKey(f[0]?.key || "");
    setErr("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function setBasic(key, value) {
    if (key === "mode") {
      setForm((p) => {
        const nextMode = value;
        const kinds = allowedKinds(nextMode);
        const nextKind = kinds.includes(p.kind) ? p.kind : kinds[0];
        return { ...p, mode: nextMode, kind: nextKind };
      });
      return;
    }
    setForm((p) => ({ ...p, [key]: value }));
  }

  function updatePricing(key, value) {
    setForm((p) => ({
      ...p,
      pricing: { ...(p.pricing || {}), [key]: value },
    }));
  }

  function fieldsForUi() {
    const arr = Array.isArray(form.fields) ? form.fields : [];
    return arr.map((f) => ({
      ...f,
      key: normKey(f.key),
      label: String(f.label || "").trim(),
      type: f.type || "select",
      required: !!f.required,
      allowNone: !!f.allowNone,
      uiHint: String(f.uiHint || "").trim(),
    }));
  }

  function optionsForKey(key) {
    const opts = Array.isArray(form.options) ? form.options : [];
    return opts
      .filter((o) => o.key === key)
      .map((o) => ({
        ...o,
        key: normKey(o.key),
        value: normKey(o.value),
        label: String(o.label || "").trim(),
        promptSnippet: String(o.promptSnippet || ""),
        isNone: !!o.isNone,
      }));
  }

  function addField() {
    const key = `field_${uid()}`;
    const f = { key, label: "New Field", type: "select", required: false, allowNone: true, uiHint: "" };
    setForm((p) => ({ ...p, fields: [...(p.fields || []), f] }));
    setActiveFieldKey(key);
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
    setForm((p) => {
      const nf = (p.fields || []).filter((f) => f.key !== key);
      const no = (p.options || []).filter((o) => o.key !== key);
      return { ...p, fields: nf, options: no };
    });
    if (activeFieldKey === key) {
      const nextKey = (form.fields || []).find((f) => f.key !== key)?.key || "";
      setActiveFieldKey(nextKey);
    }
  }

  function addOption(key) {
    const opt = { key, value: `opt_${uid()}`, label: "New Option", promptSnippet: "", isNone: false };
    setForm((p) => ({ ...p, options: [...(p.options || []), opt] }));
  }

  function updateOption(key, value, patch) {
    setForm((p) => {
      const next = [...(p.options || [])];
      const idx = next.findIndex((o) => o.key === key && o.value === value);
      if (idx === -1) return p;
      next[idx] = { ...next[idx], ...patch };
      return { ...p, options: next };
    });
  }

  function removeOption(key, value) {
    setForm((p) => {
      const next = (p.options || []).filter((o) => !(o.key === key && o.value === value));
      return { ...p, options: next };
    });
  }

  function validateForm() {
    const code = normKey(form.code);
    if (!form.name.trim()) return "Name is required";
    if (!code) return "Code is required";
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
      if (opts.length === 0) return `Field "${f.label || f.key}" needs options`;
      const vals = new Set();
      for (const o of opts) {
        const v = normKey(o.value);
        if (!v) return `Option value missing in "${f.label || f.key}"`;
        if (vals.has(v)) return `Duplicate option value "${v}" in "${f.label || f.key}"`;
        vals.add(v);
      }
    }

    return "";
  }

  async function save() {
    if (saving) return;
    setErr("");
    const msg = validateForm();
    if (msg) {
      setErr(msg);
      return;
    }

    const payload = {
      section: form.section,
      mode: form.mode,
      kind: form.kind,
      code: normKey(form.code),
      name: form.name.trim(),
      basePrompt: form.basePrompt,
      fields: (form.fields || []).map((f) => ({
        key: normKey(f.key),
        label: String(f.label || "").trim(),
        type: f.type || "select",
        required: !!f.required,
        allowNone: !!f.allowNone,
        uiHint: String(f.uiHint || "").trim(),
      })),
      options: (form.options || []).map((o) => ({
        key: normKey(o.key),
        value: normKey(o.value),
        label: String(o.label || "").trim(),
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
    setErr("");
    try {
      const updated = row.isActive ? await adminDeactivatePrompt(row._id) : await adminActivatePrompt(row._id);
      setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Action failed");
    }
  }

  const activeFields = fieldsForUi();
  const selectedField = activeFields.find((f) => f.key === activeFieldKey) || activeFields[0] || null;
  const selectedKey = selectedField?.key || "";
  const selectedOptions = selectedKey ? optionsForKey(selectedKey) : [];

  const filterKindOptions = useMemo(() => {
    if (filterMode === "video") return ["t2v", "i2v"];
    if (filterMode === "image") return ["t2i", "i2i"];
    return ["t2i", "i2i", "t2v", "i2v"];
  }, [filterMode]);

  useEffect(() => {
    if (filterKind !== "all" && !filterKindOptions.includes(filterKind)) setFilterKind("all");
  }, [filterMode]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Prompts</h1>
          <div className={styles.sub}>Templates for Product / Cloth / Creator. Table view + Create/Edit modal.</div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={refresh} disabled={loading || saving} type="button">
            Refresh
          </button>
          <button className={styles.primaryBtn} onClick={openCreate} disabled={saving} type="button">
            + Create Prompt
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterItem}>
          <div className={styles.label}>Section</div>
          <select className={`${styles.select} adminSelectFix`} value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="all">All</option>
            <option value="fashion">fashion</option>
            <option value="product">product</option>
            <option value="creator">creator</option>
          </select>
        </div>

        <div className={styles.filterItem}>
          <div className={styles.label}>Mode</div>
          <select className={`${styles.select} adminSelectFix`} value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
            <option value="all">All</option>
            <option value="image">image</option>
            <option value="video">video</option>
          </select>
        </div>

        <div className={styles.filterItem}>
          <div className={styles.label}>Kind</div>
          <select className={`${styles.select} adminSelectFix`} value={filterKind} onChange={(e) => setFilterKind(e.target.value)}>
            <option value="all">All</option>
            {filterKindOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterItem}>
          <div className={styles.label}>Status</div>
          <select className={`${styles.select} adminSelectFix`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className={styles.rightInfo}>{loading ? "Loading..." : `${filtered.length} items`}</div>
      </div>

      {err ? <div className={styles.error}>{err}</div> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Section</th>
              <th>Mode</th>
              <th>Kind</th>
              <th>Normal</th>
              <th>High</th>
              <th>Status</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((row) => (
              <tr key={row._id}>
                <td>
                  <div className={styles.name}>{row.name}</div>
                  <div className={styles.mini}>{row.basePrompt ? "Base prompt set" : "No base prompt"}</div>
                </td>
                <td className={styles.mono}>{row.code}</td>
                <td>
                  <span className={styles.badge}>{row.section}</span>
                </td>
                <td>
                  <span className={styles.badge}>{row.mode || "image"}</span>
                </td>
                <td>
                  <span className={styles.badge}>{row.kind}</span>
                </td>
                <td className={styles.mono}>{numOr(row?.pricing?.normalCredits, 2)}</td>
                <td className={styles.mono}>{numOr(row?.pricing?.highCredits, 4)}</td>
                <td>
                  <span className={row.isActive ? styles.statusActive : styles.statusInactive}>{row.isActive ? "Active" : "Inactive"}</span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.ghostBtn} onClick={() => openEdit(row)} disabled={saving} type="button">
                    Edit
                  </button>
                  <button
                    className={row.isActive ? styles.dangerBtn : styles.successBtn}
                    onClick={() => toggleActive(row)}
                    disabled={saving}
                    type="button"
                  >
                    {row.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  No prompts found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminModal open={open} title={editing ? "Edit Prompt" : "Create Prompt"} onClose={closeModal}>
        <div className={styles.modalTabs}>
          <button type="button" className={tab === "basic" ? styles.tabActive : styles.tab} onClick={() => setTab("basic")}>
            Basic
          </button>
          <button type="button" className={tab === "fields" ? styles.tabActive : styles.tab} onClick={() => setTab("fields")}>
            Fields
          </button>
          <button type="button" className={tab === "options" ? styles.tabActive : styles.tab} onClick={() => setTab("options")}>
            Options
          </button>
          <button type="button" className={tab === "credits" ? styles.tabActive : styles.tab} onClick={() => setTab("credits")}>
            Credits
          </button>
        </div>

        {err ? <div className={styles.errorInModal}>{err}</div> : null}

        {tab === "basic" ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.label}>Section</div>
              <select className={`${styles.input} adminSelectFix`} value={form.section} onChange={(e) => setBasic("section", e.target.value)} disabled={saving}>
                <option value="fashion">fashion</option>
                <option value="product">product</option>
                <option value="creator">creator</option>
              </select>
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Mode</div>
              <select className={`${styles.input} adminSelectFix`} value={form.mode} onChange={(e) => setBasic("mode", e.target.value)} disabled={saving}>
                <option value="image">image</option>
                <option value="video">video</option>
              </select>
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Kind</div>
              <select className={`${styles.input} adminSelectFix`} value={form.kind} onChange={(e) => setBasic("kind", e.target.value)} disabled={saving}>
                {allowedKinds(form.mode).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Code {editing ? <span className={styles.mini}>(locked)</span> : null}</div>
              <input
                className={styles.input}
                value={form.code}
                onChange={(e) => setBasic("code", e.target.value)}
                disabled={saving || !!editing?._id}
                placeholder="e.g. product_packshot_clean"
              />
            </div>

            <div className={styles.fieldWide}>
              <div className={styles.label}>Name</div>
              <input className={styles.input} value={form.name} onChange={(e) => setBasic("name", e.target.value)} disabled={saving} />
            </div>

            <div className={styles.fieldWide}>
              <div className={styles.label}>Base Prompt</div>
              <textarea className={styles.textarea} value={form.basePrompt} onChange={(e) => setBasic("basePrompt", e.target.value)} disabled={saving} />
            </div>
          </div>
        ) : null}

        {tab === "fields" ? (
          <div className={styles.split}>
            <div className={styles.left}>
              <div className={styles.rowBetween}>
                <div className={styles.sectionTitle}>Fields</div>
                <button className={styles.primaryBtnSm} onClick={addField} type="button" disabled={saving}>
                  + Field
                </button>
              </div>

              <div className={styles.list}>
                {activeFields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={activeFieldKey === f.key ? styles.listItemActive : styles.listItem}
                    onClick={() => setActiveFieldKey(f.key)}
                    disabled={saving}
                  >
                    <div className={styles.listTitle}>{f.label || f.key}</div>
                    <div className={styles.listMeta}>
                      <span className={styles.badge}>{f.type || "select"}</span>
                      {f.required ? <span className={styles.badge}>required</span> : null}
                    </div>
                  </button>
                ))}
                {activeFields.length === 0 ? <div className={styles.emptyBox}>No fields yet</div> : null}
              </div>
            </div>

            <div className={styles.right}>
              {selectedField ? (
                <div className={styles.panel}>
                  <div className={styles.rowBetween}>
                    <div className={styles.sectionTitle}>Edit Field</div>
                    <button className={styles.dangerBtnSm} onClick={() => removeField(selectedKey)} type="button" disabled={saving}>
                      Remove
                    </button>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <div className={styles.label}>Key</div>
                      <input className={styles.input} value={selectedField.key} onChange={(e) => updateField(selectedKey, { key: e.target.value })} disabled={saving} />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.label}>Type</div>
                      <select
                        className={`${styles.input} adminSelectFix`}
                        value={selectedField.type || "select"}
                        onChange={(e) => updateField(selectedKey, { type: e.target.value })}
                        disabled={saving}
                      >
                        <option value="select">select</option>
                        <option value="text">text</option>
                        <option value="number">number</option>
                      </select>
                    </div>

                    <div className={styles.fieldWide}>
                      <div className={styles.label}>Label</div>
                      <input className={styles.input} value={selectedField.label} onChange={(e) => updateField(selectedKey, { label: e.target.value })} disabled={saving} />
                    </div>

                    <div className={styles.fieldWide}>
                      <div className={styles.label}>UI Hint</div>
                      <input className={styles.input} value={selectedField.uiHint || ""} onChange={(e) => updateField(selectedKey, { uiHint: e.target.value })} disabled={saving} />
                    </div>

                    <div className={styles.checkRow}>
                      <label className={styles.check}>
                        <input type="checkbox" checked={!!selectedField.required} onChange={(e) => updateField(selectedKey, { required: e.target.checked })} disabled={saving} />
                        <span>Required</span>
                      </label>

                      <label className={styles.check}>
                        <input type="checkbox" checked={!!selectedField.allowNone} onChange={(e) => updateField(selectedKey, { allowNone: e.target.checked })} disabled={saving} />
                        <span>Allow None</span>
                      </label>
                    </div>

                    <div className={styles.note}>
                      Placeholders: {"{field_key}"} will be replaced automatically if used inside Base Prompt.
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyBox}>Select a field to edit</div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "options" ? (
          <div className={styles.split}>
            <div className={styles.left}>
              <div className={styles.rowBetween}>
                <div className={styles.sectionTitle}>Fields</div>
              </div>

              <div className={styles.list}>
                {activeFields
                  .filter((f) => (f.type || "select") === "select")
                  .map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={activeFieldKey === f.key ? styles.listItemActive : styles.listItem}
                      onClick={() => setActiveFieldKey(f.key)}
                      disabled={saving}
                    >
                      <div className={styles.listTitle}>{f.label || f.key}</div>
                      <div className={styles.listMeta}>
                        <span className={styles.badge}>{optionsForKey(f.key).length} options</span>
                      </div>
                    </button>
                  ))}
                {activeFields.filter((f) => (f.type || "select") === "select").length === 0 ? <div className={styles.emptyBox}>No select fields</div> : null}
              </div>
            </div>

            <div className={styles.right}>
              {selectedKey ? (
                <div className={styles.panel}>
                  <div className={styles.rowBetween}>
                    <div className={styles.sectionTitle}>Options</div>
                    <button className={styles.primaryBtnSm} onClick={() => addOption(selectedKey)} type="button" disabled={saving}>
                      + Option
                    </button>
                  </div>

                  <div className={styles.optionsList}>
                    {selectedOptions.map((o) => (
                      <div key={`${o.key}:${o.value}`} className={styles.optionRow}>
                        <div className={styles.optionGrid}>
                          <div className={styles.field}>
                            <div className={styles.label}>Value</div>
                            <input className={styles.input} value={o.value} onChange={(e) => updateOption(selectedKey, o.value, { value: e.target.value })} disabled={saving} />
                          </div>

                          <div className={styles.field}>
                            <div className={styles.label}>Label</div>
                            <input className={styles.input} value={o.label} onChange={(e) => updateOption(selectedKey, o.value, { label: e.target.value })} disabled={saving} />
                          </div>

                          <div className={styles.fieldWide}>
                            <div className={styles.label}>Prompt Snippet</div>
                            <textarea
                              className={styles.textareaSm}
                              value={o.promptSnippet || ""}
                              onChange={(e) => updateOption(selectedKey, o.value, { promptSnippet: e.target.value })}
                              disabled={saving}
                            />
                          </div>

                          <div className={styles.checkRow}>
                            <label className={styles.check}>
                              <input type="checkbox" checked={!!o.isNone} onChange={(e) => updateOption(selectedKey, o.value, { isNone: e.target.checked })} disabled={saving} />
                              <span>None option</span>
                            </label>

                            <button className={styles.dangerBtnSm} onClick={() => removeOption(selectedKey, o.value)} type="button" disabled={saving}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedOptions.length === 0 ? <div className={styles.emptyBox}>No options yet</div> : null}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyBox}>Select a field to manage options</div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "credits" ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.label}>Normal Credits</div>
              <input
                className={styles.input}
                value={form.pricing?.normalCredits ?? 2}
                onChange={(e) => updatePricing("normalCredits", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>High Credits</div>
              <input className={styles.input} value={form.pricing?.highCredits ?? 4} onChange={(e) => updatePricing("highCredits", e.target.value)} disabled={saving} />
            </div>

            <div className={styles.checkRow}>
              <label className={styles.check}>
                <input type="checkbox" checked={!!form.isActive} onChange={(e) => setBasic("isActive", e.target.checked)} disabled={saving} />
                <span>Active</span>
              </label>
            </div>
          </div>
        ) : null}

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={closeModal} type="button" disabled={saving}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={save} type="button" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
