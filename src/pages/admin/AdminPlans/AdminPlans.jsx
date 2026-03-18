import { useEffect, useMemo, useState } from "react";
import styles from "./AdminPlans.module.css";
import {
  adminListPlans,
  adminCreatePlan,
  adminUpdatePlan,
} from "../../../services/admin/adminPlans";
import api from "../../../api/api";

function getBhdAmount(arr) {
  const row = (arr || []).find((p) => p.currency === "BHD");
  return row?.amount ?? null;
}

async function hardDeletePlan(id) {
  await api.delete(`/admin/plans/${id}/hard`);
}

export default function AdminPlans() {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busyId, setBusyId]       = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [editingPlan, setEditingPlan]   = useState(null);

  const [form, setForm] = useState({
    code: "", name: "", description: "",
    monthlyPoints: 50, priceBhd: 5, salePriceBhd: "", isActive: true,
  });

  const sorted = useMemo(
    () => [...plans].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [plans]
  );

  async function load() {
    try {
      setError(""); setLoading(true);
      const data = await adminListPlans();
      setPlans(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load plans");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ code: "", name: "", description: "", monthlyPoints: 50, priceBhd: 5, salePriceBhd: "", isActive: true });
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  // ── Create ──
  function openCreate() { setError(""); resetForm(); setIsCreateOpen(true); }
  function closeCreate() { setIsCreateOpen(false); }

  async function onCreate(e) {
    e.preventDefault();
    try {
      setError(""); setSaving(true);
      const saleNum = form.salePriceBhd === "" ? null : Number(form.salePriceBhd);
      const payload = {
        code: form.code.trim(), name: form.name.trim(),
        description: form.description?.trim() || "",
        monthlyPoints: Number(form.monthlyPoints),
        prices: [{ currency: "BHD", amount: Number(form.priceBhd) }],
        salePrices: saleNum !== null && !Number.isNaN(saleNum) ? [{ currency: "BHD", amount: saleNum }] : [],
        isActive: Boolean(form.isActive),
      };
      const created = await adminCreatePlan(payload);
      setPlans((prev) => [created, ...prev]);
      closeCreate();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Create failed");
    } finally { setSaving(false); }
  }

  // ── Edit ──
  function openEdit(plan) {
    setError("");
    setEditingPlan(plan);
    const price = getBhdAmount(plan.prices);
    const sale  = getBhdAmount(plan.salePrices);
    setForm({
      code: plan.code || "", name: plan.name || "",
      description: plan.description || "",
      monthlyPoints: plan.monthlyPoints ?? 0,
      priceBhd: price ?? 0, salePriceBhd: sale ?? "",
      isActive: Boolean(plan.isActive),
    });
    setIsEditOpen(true);
  }
  function closeEdit() { setIsEditOpen(false); setEditingPlan(null); }

  async function onEditSave(e) {
    e.preventDefault();
    if (!editingPlan?._id) return;
    try {
      setError(""); setSaving(true);
      const saleNum = form.salePriceBhd === "" ? null : Number(form.salePriceBhd);
      const payload = {
        name: form.name.trim(), description: form.description?.trim() || "",
        monthlyPoints: Number(form.monthlyPoints),
        prices: [{ currency: "BHD", amount: Number(form.priceBhd) }],
        salePrices: saleNum !== null && !Number.isNaN(saleNum) ? [{ currency: "BHD", amount: saleNum }] : [],
        isActive: Boolean(form.isActive),
      };
      const updated = await adminUpdatePlan(editingPlan._id, payload);
      setPlans((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      closeEdit();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Update failed");
    } finally { setSaving(false); }
  }

  // ── Toggle Active ──
  async function toggleActive(plan) {
    try {
      setError(""); setBusyId(plan._id);
      const updated = await adminUpdatePlan(plan._id, { isActive: !plan.isActive });
      setPlans((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Update failed");
    } finally { setBusyId(null); }
  }

  // ── Hard Delete (بدون confirm) ──
  async function handleDelete(plan) {
    try {
      setError(""); setDeletingId(plan._id);
      await hardDeletePlan(plan._id);
      setPlans((prev) => prev.filter((p) => p._id !== plan._id));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    } finally { setDeletingId(null); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h2 className={styles.title}>Plans</h2>
          <p className={styles.subtitle}>Table view + Create/Edit modal + Sale price.</p>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.btnSecondary} onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className={styles.btnPrimary} onClick={openCreate}>+ Create Plan</button>
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.card}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : sorted.length === 0 ? (
          <div className={styles.empty}>No plans yet.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Monthly Points</th>
                  <th>Price</th>
                  <th>Sale</th>
                  <th>Effective</th>
                  <th>Status</th>
                  <th className={styles.thAction}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((plan) => {
                  const price     = getBhdAmount(plan.prices);
                  const sale      = getBhdAmount(plan.salePrices);
                  const effective = sale ?? price;
                  const isRowBusy    = busyId === plan._id;
                  const isDeleting   = deletingId === plan._id;

                  return (
                    <tr key={plan._id}>
                      <td>
                        <div className={styles.mainText}>{plan.name}</div>
                        {plan.description ? <div className={styles.muted}>{plan.description}</div> : null}
                      </td>
                      <td className={styles.muted}>{plan.code}</td>
                      <td>{plan.monthlyPoints}</td>
                      <td>{price ?? "-"}</td>
                      <td>{sale ?? "-"}</td>
                      <td className={sale != null ? styles.effectiveOn : ""}>{effective ?? "-"}</td>
                      <td>
                        <span className={plan.isActive ? styles.badgeOn : styles.badgeOff}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.btnSmall} onClick={() => openEdit(plan)} disabled={isDeleting}>
                          Edit
                        </button>
                        <button
                          className={plan.isActive ? styles.btnDangerSmall : styles.btnSuccessSmall}
                          onClick={() => toggleActive(plan)}
                          disabled={isRowBusy || isDeleting}
                        >
                          {isRowBusy ? "Saving..." : plan.isActive ? "Deactivate" : "Activate"}
                        </button>
                        {/* ✅ Delete مباشر بدون confirm */}
                        <button
                          className={styles.btnDeleteSmall}
                          onClick={() => handleDelete(plan)}
                          disabled={isDeleting || isRowBusy}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen ? (
        <div className={styles.modalOverlay} onMouseDown={closeCreate}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create Plan</h3>
              <button className={styles.iconBtn} onClick={closeCreate}>✕</button>
            </div>
            <form className={styles.form} onSubmit={onCreate}>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>Code</span>
                  <input className={styles.input} name="code" value={form.code} onChange={onChange} placeholder="pro_monthly" required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Name</span>
                  <input className={styles.input} name="name" value={form.name} onChange={onChange} required />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>Name (Arabic) — الاسم بالعربي</span>
                <input className={styles.input} name="nameAr" value={form.nameAr || ""} onChange={onChange} placeholder="الاسم بالعربي" dir="rtl" />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Description</span>
                <input className={styles.input} name="description" value={form.description} onChange={onChange} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Description (Arabic) — الوصف بالعربي</span>
                <input className={styles.input} name="descriptionAr" value={form.descriptionAr || ""} onChange={onChange} placeholder="الوصف بالعربي" dir="rtl" />
              </label>
              <div className={styles.grid4}>
                <label className={styles.field}>
                  <span className={styles.label}>Monthly Points</span>
                  <input className={styles.input} name="monthlyPoints" type="number" min="0" max="1000" value={form.monthlyPoints} onChange={onChange} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Price (BHD)</span>
                  <input className={styles.input} name="priceBhd" type="number" min="0" step="0.001" value={form.priceBhd} onChange={onChange} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Sale Price (BHD)</span>
                  <input className={styles.input} name="salePriceBhd" type="number" min="0" step="0.001" value={form.salePriceBhd} onChange={onChange} placeholder="Optional" />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Active?</span>
                  <div className={styles.checkRow}>
                    <input className={styles.checkbox} name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />
                    <span className={styles.muted}>{form.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeCreate}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {isEditOpen ? (
        <div className={styles.modalOverlay} onMouseDown={closeEdit}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Plan</h3>
              <button className={styles.iconBtn} onClick={closeEdit}>✕</button>
            </div>
            <form className={styles.form} onSubmit={onEditSave}>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>Code (read-only)</span>
                  <input className={styles.input} value={form.code} disabled />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Name</span>
                  <input className={styles.input} name="name" value={form.name} onChange={onChange} required />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>Name (Arabic) — الاسم بالعربي</span>
                <input className={styles.input} name="nameAr" value={form.nameAr || ""} onChange={onChange} placeholder="الاسم بالعربي" dir="rtl" />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Description</span>
                <input className={styles.input} name="description" value={form.description} onChange={onChange} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Description (Arabic) — الوصف بالعربي</span>
                <input className={styles.input} name="descriptionAr" value={form.descriptionAr || ""} onChange={onChange} placeholder="الوصف بالعربي" dir="rtl" />
              </label>
              <div className={styles.grid4}>
                <label className={styles.field}>
                  <span className={styles.label}>Monthly Points</span>
                  <input className={styles.input} name="monthlyPoints" type="number" min="0" max="1000" value={form.monthlyPoints} onChange={onChange} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Price (BHD)</span>
                  <input className={styles.input} name="priceBhd" type="number" min="0" step="0.001" value={form.priceBhd} onChange={onChange} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Sale Price (BHD)</span>
                  <input className={styles.input} name="salePriceBhd" type="number" min="0" step="0.001" value={form.salePriceBhd} onChange={onChange} placeholder="Leave empty to remove sale" />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Active?</span>
                  <div className={styles.checkRow}>
                    <input className={styles.checkbox} name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />
                    <span className={styles.muted}>{form.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeEdit}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}