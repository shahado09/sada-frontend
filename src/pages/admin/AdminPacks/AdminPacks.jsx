import { useEffect, useMemo, useState } from "react";
import styles from "./AdminPacks.module.css";
import {
  adminListPacks,
  adminCreatePack,
  adminUpdatePack,
} from "../../../services/admin/adminPacks";
import api from "../../../api/api";

function getBhdAmount(arr) {
  const row = (arr || []).find((p) => p.currency === "BHD");
  return row?.amount ?? null;
}

async function hardDeletePack(id) {
  await api.delete(`/admin/packs/${id}/hard`);
}

export default function AdminPacks() {
  const [packs, setPacks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busyId, setBusyId]       = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [editingPack, setEditingPack]   = useState(null);

  const [form, setForm] = useState({
    code: "", name: "", description: "",
    points: 10, priceBhd: 1, salePriceBhd: "", isActive: true,
  });

  const sorted = useMemo(
    () => [...packs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [packs]
  );

  async function load() {
    try {
      setError(""); setLoading(true);
      const data = await adminListPacks();
      setPacks(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load packs");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ code: "", name: "", description: "", points: 10, priceBhd: 1, salePriceBhd: "", isActive: true });
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
        points: Number(form.points),
        prices: [{ currency: "BHD", amount: Number(form.priceBhd) }],
        salePrices: saleNum !== null && !Number.isNaN(saleNum) ? [{ currency: "BHD", amount: saleNum }] : [],
        isActive: Boolean(form.isActive),
      };
      const created = await adminCreatePack(payload);
      setPacks((prev) => [created, ...prev]);
      closeCreate();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Create failed");
    } finally { setSaving(false); }
  }

  // ── Edit ──
  function openEdit(pack) {
    setError("");
    setEditingPack(pack);
    const price = getBhdAmount(pack.prices);
    const sale  = getBhdAmount(pack.salePrices);
    setForm({
      code: pack.code || "", name: pack.name || "",
      description: pack.description || "",
      points: pack.points ?? 10,
      priceBhd: price ?? 0, salePriceBhd: sale ?? "",
      isActive: Boolean(pack.isActive),
    });
    setIsEditOpen(true);
  }
  function closeEdit() { setIsEditOpen(false); setEditingPack(null); }

  async function onEditSave(e) {
    e.preventDefault();
    if (!editingPack?._id) return;
    try {
      setError(""); setSaving(true);
      const saleNum = form.salePriceBhd === "" ? null : Number(form.salePriceBhd);
      const payload = {
        name: form.name.trim(), description: form.description?.trim() || "",
        points: Number(form.points),
        prices: [{ currency: "BHD", amount: Number(form.priceBhd) }],
        salePrices: saleNum !== null && !Number.isNaN(saleNum) ? [{ currency: "BHD", amount: saleNum }] : [],
        isActive: Boolean(form.isActive),
      };
      const updated = await adminUpdatePack(editingPack._id, payload);
      setPacks((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      closeEdit();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Update failed");
    } finally { setSaving(false); }
  }

  // ── Toggle Active ──
  async function toggleActive(pack) {
    try {
      setError(""); setBusyId(pack._id);
      const updated = await adminUpdatePack(pack._id, { isActive: !pack.isActive });
      setPacks((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Update failed");
    } finally { setBusyId(null); }
  }

  // ── Hard Delete  ──
  async function handleDelete(pack) {
    try {
      setError(""); setDeletingId(pack._id);
      await hardDeletePack(pack._id);
      setPacks((prev) => prev.filter((p) => p._id !== pack._id));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    } finally { setDeletingId(null); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h2 className={styles.title}>Credit Packs</h2>
          <p className={styles.subtitle}>Table view + Create/Edit modal + Sale price.</p>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.btnSecondary} onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className={styles.btnPrimary} onClick={openCreate}>+ Create Pack</button>
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.card}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : sorted.length === 0 ? (
          <div className={styles.empty}>No packs yet.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Points</th>
                  <th>Price</th>
                  <th>Sale</th>
                  <th>Effective</th>
                  <th>Status</th>
                  <th className={styles.thAction}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((pack) => {
                  const price      = getBhdAmount(pack.prices);
                  const sale       = getBhdAmount(pack.salePrices);
                  const effective  = sale ?? price;
                  const isRowBusy  = busyId === pack._id;
                  const isDeleting = deletingId === pack._id;

                  return (
                    <tr key={pack._id}>
                      <td>
                        <div className={styles.mainText}>{pack.name}</div>
                        {pack.description ? <div className={styles.muted}>{pack.description}</div> : null}
                      </td>
                      <td className={styles.muted}>{pack.code}</td>
                      <td>{pack.points}</td>
                      <td>{price ?? "-"}</td>
                      <td>{sale ?? "-"}</td>
                      <td className={sale != null ? styles.effectiveOn : ""}>{effective ?? "-"}</td>
                      <td>
                        <span className={pack.isActive ? styles.badgeOn : styles.badgeOff}>
                          {pack.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.btnSecondarySmall} onClick={() => openEdit(pack)} disabled={isDeleting}>
                          Edit
                        </button>
                        <button
                          className={pack.isActive ? styles.btnDangerSmall : styles.btnSuccessSmall}
                          onClick={() => toggleActive(pack)}
                          disabled={isRowBusy || isDeleting}
                        >
                          {isRowBusy ? "Saving..." : pack.isActive ? "Deactivate" : "Activate"}
                        </button>
                        {/* ✅ Delete مباشر بدون confirm */}
                        <button
                          className={styles.btnDeleteSmall}
                          onClick={() => handleDelete(pack)}
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
              <h3 className={styles.modalTitle}>Create Pack</h3>
              <button className={styles.iconBtn} onClick={closeCreate}>✕</button>
            </div>
            <form className={styles.form} onSubmit={onCreate}>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>Code</span>
                  <input className={styles.input} name="code" value={form.code} onChange={onChange} placeholder="starter_pack" required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Name</span>
                  <input className={styles.input} name="name" value={form.name} onChange={onChange} placeholder="Starter Pack" required />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>Description</span>
                <input className={styles.input} name="description" value={form.description} onChange={onChange} placeholder="Optional" />
              </label>
              <div className={styles.grid4}>
                <label className={styles.field}>
                  <span className={styles.label}>Points</span>
                  <input className={styles.input} name="points" type="number" min="1" max="1000" value={form.points} onChange={onChange} required />
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
              <h3 className={styles.modalTitle}>Edit Pack</h3>
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
                <span className={styles.label}>Description</span>
                <input className={styles.input} name="description" value={form.description} onChange={onChange} />
              </label>
              <div className={styles.grid4}>
                <label className={styles.field}>
                  <span className={styles.label}>Points</span>
                  <input className={styles.input} name="points" type="number" min="1" max="1000" value={form.points} onChange={onChange} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Price (BHD)</span>
                  <input className={styles.input} name="priceBhd" type="number" min="0" step="0.001" value={form.priceBhd} onChange={onChange} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Sale Price (BHD)</span>
                  <input className={styles.input} name="salePriceBhd" type="number" min="0" step="0.001" value={form.salePriceBhd} onChange={onChange} placeholder="Leave empty to remove" />
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
