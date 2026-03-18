import { useEffect, useState, useCallback } from "react";
import styles from "./AdminUsers.module.css";
import api from "../../../api/api";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  const [editUser, setEditUser]   = useState(null);
  const [editMode, setEditMode]   = useState(""); // "credits" | "role"
  const [creditVal, setCreditVal] = useState("");
  const [creditOp, setCreditOp]   = useState("set"); // "set" | "adjust"
  const [roleVal, setRoleVal]     = useState("user");
  const [saving, setSaving]       = useState(false);
  const [editMsg, setEditMsg]     = useState({ text: "", ok: false });

  const LIMIT = 20;

  const load = useCallback(async () => {
    try {
      setError(""); setLoading(true);
      const res = await api.get(`/admin/users?search=${search}&page=${page}&limit=${LIMIT}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  function openEdit(user, mode) {
    setEditUser(user);
    setEditMode(mode);
    setCreditVal(String(user.credits));
    setCreditOp("set");
    setRoleVal(user.role);
    setEditMsg({ text: "", ok: false });
  }

  function closeEdit() { setEditUser(null); setEditMode(""); }

  async function saveCredits() {
    const num = Number(creditVal);
    if (isNaN(num)) { setEditMsg({ text: "Enter a valid number", ok: false }); return; }
    setSaving(true); setEditMsg({ text: "", ok: false });
    try {
      const endpoint = creditOp === "set"
        ? `/admin/users/${editUser._id}/credits/set`
        : `/admin/users/${editUser._id}/credits/adjust`;
      const payload = creditOp === "set" ? { credits: num } : { amount: num };
      const res = await api.patch(endpoint, payload);
      setUsers(prev => prev.map(u => u._id === res.data.user._id ? res.data.user : u));
      setEditMsg({ text: "Credits updated ✓", ok: true });
    } catch (e) {
      setEditMsg({ text: e?.response?.data?.message || "Failed", ok: false });
    } finally { setSaving(false); }
  }

  async function saveRole() {
    setSaving(true); setEditMsg({ text: "", ok: false });
    try {
      const res = await api.patch(`/admin/users/${editUser._id}/role`, { role: roleVal });
      setUsers(prev => prev.map(u => u._id === res.data.user._id ? res.data.user : u));
      setEditMsg({ text: "Role updated ✓", ok: true });
    } catch (e) {
      setEditMsg({ text: e?.response?.data?.message || "Failed", ok: false });
    } finally { setSaving(false); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h2 className={styles.title}>Users</h2>
          <p className={styles.subtitle}>{total} total users</p>
        </div>
        <div className={styles.topbarRight}>
          <input
            className={styles.search}
            placeholder="Search by email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button className={styles.btnSecondary} onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className={styles.alert}>{error}</div>}

      <div className={styles.card}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>No users found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Credits</th>
                  <th>Joined</th>
                  <th className={styles.thAction}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>
                      <span className={u.role === "admin" ? styles.badgeAdmin : styles.badgeUser}>
                        {u.role}
                      </span>
                    </td>
                    <td className={styles.creditsCell}>{u.credits}</td>
                    <td className={styles.muted}>{formatDate(u.createdAt)}</td>
                    <td className={styles.actionsCell}>
                      <button className={styles.btnSmall} onClick={() => openEdit(u, "credits")}>
                        Credits
                      </button>
                      <button className={styles.btnSmall} onClick={() => openEdit(u, "role")}>
                        Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.btnSecondary} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button className={styles.btnSecondary} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}

      {/* Modal */}
      {editUser && (
        <div className={styles.modalOverlay} onMouseDown={closeEdit}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {editMode === "credits" ? "Adjust Credits" : "Change Role"}
                </h3>
                <div className={styles.modalSub}>{editUser.email}</div>
              </div>
              <button className={styles.iconBtn} onClick={closeEdit}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {editMode === "credits" ? (
                <>
                  <div className={styles.currentRow}>
                    <span className={styles.currentLabel}>Current credits</span>
                    <span className={styles.currentValue}>{editUser.credits}</span>
                  </div>
                  <div className={styles.opRow}>
                    <button
                      className={`${styles.opBtn} ${creditOp === "set" ? styles.opBtnActive : ""}`}
                      onClick={() => setCreditOp("set")}>Set to</button>
                    <button
                      className={`${styles.opBtn} ${creditOp === "adjust" ? styles.opBtnActive : ""}`}
                      onClick={() => setCreditOp("adjust")}>Add / Remove</button>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      {creditOp === "set" ? "New value" : "Amount (use negative to remove)"}
                    </label>
                    <input
                      className={styles.input}
                      type="number"
                      value={creditVal}
                      onChange={e => setCreditVal(e.target.value)}
                    />
                  </div>
                  {editMsg.text && <div className={editMsg.ok ? styles.ok : styles.err}>{editMsg.text}</div>}
                  <button className={styles.btnPrimary} onClick={saveCredits} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.currentRow}>
                    <span className={styles.currentLabel}>Current role</span>
                    <span className={editUser.role === "admin" ? styles.badgeAdmin : styles.badgeUser}>
                      {editUser.role}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>New role</label>
                    <div className={styles.opRow}>
                      <button
                        className={`${styles.opBtn} ${roleVal === "user" ? styles.opBtnActive : ""}`}
                        onClick={() => setRoleVal("user")}>User</button>
                      <button
                        className={`${styles.opBtn} ${roleVal === "admin" ? styles.opBtnActive : ""}`}
                        onClick={() => setRoleVal("admin")}>Admin</button>
                    </div>
                  </div>
                  {editMsg.text && <div className={editMsg.ok ? styles.ok : styles.err}>{editMsg.text}</div>}
                  <button className={styles.btnPrimary} onClick={saveRole} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}