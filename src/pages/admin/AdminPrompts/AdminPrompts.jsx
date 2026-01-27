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

export default function AdminPrompts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterSection, setFilterSection] = useState("all");
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
      if (filterKind !== "all" && x.kind !== filterKind) return false;
      if (filterStatus !== "all") {
        const s = x.isActive ? "active" : "inactive";
        if (s !== filterStatus) return false;
      }
      return true;
    });
  }, [items, filterSection, filterKind, filterStatus]);

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
    setForm({
      section: row.section || "fashion",
      kind: row.kind || "t2i",
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

  function setBasic(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function setPricing(k, v) {
    setForm((p) => ({ ...p, pricing: { ...p.pricing, [k]: v } }));
  }

  function fieldsForUi() {
    return Array.isArray(form.fields) ? form.fields : [];
  }

  function optionsForKey(key) {
    const all = Array.isArray(form.options) ? form.options : [];
    return all.filter((o) => o.key === key);
  }

  function upsertField(index, patch) {
    setForm((p) => {
      const next = [...(p.fields || [])];
      next[index] = { ...next[index], ...patch };
      return { ...p, fields: next };
    });
  }

  function addField() {
    const k = `field_${uid()}`;
    const nextField = {
      key: k,
      label: "New Field",
      type: "select",
      required: false,
      allowNone: true,
      uiHint: "",
    };
    setForm((p) => ({ ...p, fields: [...(p.fields || []), nextField] }));
    setActiveFieldKey(k);
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
      mode: "image",
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
          <div className={styles.label}>Kind</div>
          <select className={`${styles.select} adminSelectFix`} value={filterKind} onChange={(e) => setFilterKind(e.target.value)}>
            <option value="all">All</option>
            <option value="t2i">t2i</option>
            <option value="i2i">i2i</option>
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
                <td><span className={styles.badge}>{row.section}</span></td>
                <td><span className={styles.badge}>{row.kind}</span></td>
                <td className={styles.mono}>{numOr(row?.pricing?.normalCredits, 2)}</td>
                <td className={styles.mono}>{numOr(row?.pricing?.highCredits, 4)}</td>
                <td>
                  <span className={row.isActive ? styles.statusActive : styles.statusInactive}>
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
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
                <td colSpan={8} className={styles.empty}>No prompts found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminModal open={open} title={editing ? "Edit Prompt" : "Create Prompt"} onClose={closeModal}>
        <div className={styles.modalTabs}>
          <button type="button" className={tab === "basic" ? styles.tabActive : styles.tab} onClick={() => setTab("basic")}>Basic</button>
          <button type="button" className={tab === "fields" ? styles.tabActive : styles.tab} onClick={() => setTab("fields")}>Fields</button>
          <button type="button" className={tab === "options" ? styles.tabActive : styles.tab} onClick={() => setTab("options")}>Options</button>
          <button type="button" className={tab === "credits" ? styles.tabActive : styles.tab} onClick={() => setTab("credits")}>Credits</button>
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
              <div className={styles.label}>Kind</div>
              <select className={`${styles.input} adminSelectFix`} value={form.kind} onChange={(e) => setBasic("kind", e.target.value)} disabled={saving}>
                <option value="t2i">t2i</option>
                <option value="i2i">i2i</option>
              </select>
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Code {editing ? "(read-only)" : ""}</div>
              <input className={styles.input} value={form.code} onChange={(e) => setBasic("code", e.target.value)} disabled={saving || !!editing} />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Name</div>
              <input className={styles.input} value={form.name} onChange={(e) => setBasic("name", e.target.value)} disabled={saving} />
            </div>

            <div className={styles.fieldWide}>
              <div className={styles.label}>Base Prompt</div>
              <textarea className={styles.textarea} value={form.basePrompt} onChange={(e) => setBasic("basePrompt", e.target.value)} disabled={saving} />
            </div>

            <div className={styles.checkRow}>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={!!form.isActive} onChange={(e) => setBasic("isActive", e.target.checked)} disabled={saving} />
                <span>Active</span>
              </label>
            </div>
          </div>
        ) : null}

        {tab === "fields" ? (
          <div className={styles.builderStack}>
            <div className={styles.builderLeft}>
              <div className={styles.builderHead}>
                <div className={styles.builderTitle}>Fields</div>
                <button className={styles.primaryBtnSm} onClick={addField} disabled={saving} type="button">+ Add</button>
              </div>

              <div className={styles.fieldList}>
                {activeFields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={f.key === activeFieldKey ? styles.fieldItemActive : styles.fieldItem}
                    onClick={() => setActiveFieldKey(f.key)}
                  >
                    <div className={styles.fieldItemTop}>
                      <div className={styles.fieldItemLabel}>{f.label || f.key}</div>
                      <div className={styles.fieldItemKey}>{f.key}</div>
                    </div>
                    <div className={styles.fieldItemMeta}>
                      <span className={styles.pill}>{f.type || "select"}</span>
                      <span className={styles.pill}>{(optionsForKey(f.key).length || 0) + " options"}</span>
                    </div>
                  </button>
                ))}
                {activeFields.length === 0 ? <div className={styles.mutedBox}>No fields yet</div> : null}
              </div>
            </div>

            <div className={styles.builderRight}>
              {!selectedField ? (
                <div className={styles.mutedBox}>Select a field</div>
              ) : (
                <div className={styles.editor}>
                  <div className={styles.editorHead}>
                    <div>
                      <div className={styles.editorTitle}>Edit Field</div>
                      <div className={styles.editorSub}>{selectedField.key}</div>
                    </div>
                    <button className={styles.dangerBtnSm} onClick={() => removeField(selectedField.key)} disabled={saving} type="button">
                      Remove
                    </button>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <div className={styles.label}>Key</div>
                      <input
                        className={styles.input}
                        value={selectedField.key}
                        onChange={(e) => {
                          const newKey = normKey(e.target.value);
                          const oldKey = selectedField.key;
                          if (!newKey) return;
                          setForm((p) => {
                            const nf = (p.fields || []).map((x) => (x.key === oldKey ? { ...x, key: newKey } : x));
                            const no = (p.options || []).map((o) => (o.key === oldKey ? { ...o, key: newKey } : o));
                            return { ...p, fields: nf, options: no };
                          });
                          setActiveFieldKey(newKey);
                        }}
                        disabled={saving}
                      />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.label}>Label</div>
                      <input
                        className={styles.input}
                        value={selectedField.label}
                        onChange={(e) => {
                          const idx = activeFields.findIndex((x) => x.key === selectedField.key);
                          upsertField(idx, { label: e.target.value });
                        }}
                        disabled={saving}
                      />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.label}>Type</div>
                      <select
                        className={`${styles.input} adminSelectFix`}
                        value={selectedField.type || "select"}
                        onChange={(e) => {
                          const idx = activeFields.findIndex((x) => x.key === selectedField.key);
                          upsertField(idx, { type: e.target.value });
                        }}
                        disabled={saving}
                      >
                        <option value="select">select</option>
                        <option value="text">text</option>
                        <option value="number">number</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <div className={styles.label}>UI Hint</div>
                      <input
                        className={styles.input}
                        value={selectedField.uiHint || ""}
                        onChange={(e) => {
                          const idx = activeFields.findIndex((x) => x.key === selectedField.key);
                          upsertField(idx, { uiHint: e.target.value });
                        }}
                        disabled={saving}
                      />
                    </div>

                    <div className={styles.checkRow}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={!!selectedField.required}
                          onChange={(e) => {
                            const idx = activeFields.findIndex((x) => x.key === selectedField.key);
                            upsertField(idx, { required: e.target.checked });
                          }}
                          disabled={saving}
                        />
                        <span>Required</span>
                      </label>

                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={!!selectedField.allowNone}
                          onChange={(e) => {
                            const idx = activeFields.findIndex((x) => x.key === selectedField.key);
                            upsertField(idx, { allowNone: e.target.checked });
                          }}
                          disabled={saving}
                        />
                        <span>Allow None</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.tip}>
                    Use <span className={styles.monoInline}>{"{"+selectedField.key+"}"}</span> in Base Prompt if you want replacement.
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "options" ? (
          <div className={styles.builderStack}>
            <div className={styles.builderLeft}>
              <div className={styles.builderHead}>
                <div className={styles.builderTitle}>Fields</div>
              </div>

              <div className={styles.fieldList}>
                {activeFields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={f.key === activeFieldKey ? styles.fieldItemActive : styles.fieldItem}
                    onClick={() => setActiveFieldKey(f.key)}
                  >
                    <div className={styles.fieldItemTop}>
                      <div className={styles.fieldItemLabel}>{f.label || f.key}</div>
                      <div className={styles.fieldItemKey}>{f.key}</div>
                    </div>
                    <div className={styles.fieldItemMeta}>
                      <span className={styles.pill}>{f.type || "select"}</span>
                      <span className={styles.pill}>{(optionsForKey(f.key).length || 0) + " options"}</span>
                    </div>
                  </button>
                ))}
                {activeFields.length === 0 ? <div className={styles.mutedBox}>No fields yet</div> : null}
              </div>
            </div>

            <div className={styles.builderRight}>
              {!selectedField ? (
                <div className={styles.mutedBox}>Select a field</div>
              ) : (selectedField.type || "select") !== "select" ? (
                <div className={styles.mutedBox}>Options are only for type=select</div>
              ) : (
                <div className={styles.editor}>
                  <div className={styles.editorHead}>
                    <div>
                      <div className={styles.editorTitle}>Options</div>
                      <div className={styles.editorSub}>{selectedField.label || selectedField.key}</div>
                    </div>

                    <button className={styles.primaryBtnSm} onClick={() => addOption(selectedField.key)} disabled={saving} type="button">
                      + Add Option
                    </button>
                  </div>

                  <div className={styles.optionsTableWrap}>
                    <table className={styles.optionsTable}>
                      <thead>
                        <tr>
                          <th>Label</th>
                          <th>Value</th>
                          <th>Snippet</th>
                          <th>None</th>
                          <th className={styles.actionsCol}>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedOptions.map((o) => (
                          <tr key={o.value}>
                            <td>
                              <input
                                className={styles.inputSm}
                                value={o.label || ""}
                                onChange={(e) => updateOption(selectedField.key, o.value, { label: e.target.value })}
                                disabled={saving}
                              />
                            </td>

                            <td>
                              <input
                                className={styles.inputSm}
                                value={o.value || ""}
                                onChange={(e) => {
                                  const newVal = normKey(e.target.value);
                                  if (!newVal) return;
                                  setForm((p) => {
                                    const next = [...(p.options || [])];
                                    const idx = next.findIndex((x) => x.key === selectedField.key && x.value === o.value);
                                    if (idx === -1) return p;
                                    next[idx] = { ...next[idx], value: newVal };
                                    return { ...p, options: next };
                                  });
                                }}
                                disabled={saving}
                              />
                            </td>

                            <td>
                              <textarea
                                className={styles.textareaSm}
                                value={o.promptSnippet || ""}
                                onChange={(e) => updateOption(selectedField.key, o.value, { promptSnippet: e.target.value })}
                                disabled={saving}
                                placeholder="Text added to prompt"
                              />
                            </td>

                            <td className={styles.center}>
                              <input
                                type="checkbox"
                                checked={!!o.isNone}
                                onChange={(e) => updateOption(selectedField.key, o.value, { isNone: e.target.checked })}
                                disabled={saving}
                              />
                            </td>

                            <td className={styles.actions}>
                              <button className={styles.dangerBtnSm} onClick={() => removeOption(selectedField.key, o.value)} disabled={saving} type="button">
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}

                        {selectedOptions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={styles.empty}>No options yet</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.tip}>
                    If Base Prompt has placeholders, snippets replace <span className={styles.monoInline}>{"{"+selectedField.key+"}"}</span>.
                    Otherwise snippets append under Base Prompt.
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "credits" ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.label}>Normal Credits</div>
              <input
                type="number"
                className={styles.input}
                value={form.pricing?.normalCredits ?? 2}
                onChange={(e) => setPricing("normalCredits", e.target.value)}
                disabled={saving}
                min="0"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>High Credits</div>
              <input
                type="number"
                className={styles.input}
                value={form.pricing?.highCredits ?? 4}
                onChange={(e) => setPricing("highCredits", e.target.value)}
                disabled={saving}
                min="0"
              />
            </div>

            <div className={styles.fieldWide}>
              <div className={styles.mutedBox}>
                Credits saved in template.pricing: normalCredits/highCredits.
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={closeModal} disabled={saving} type="button">
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={save} disabled={saving} type="button">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
