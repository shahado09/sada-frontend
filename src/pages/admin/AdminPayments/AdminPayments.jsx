import { useEffect, useMemo, useState } from "react";
import AdminModal from "../../../components/admin/AdminModal/AdminModal";
import StatusBadge from "../../../components/admin/StatusBadge/StatusBadge";
import {
  adminApprovePayment,
  adminListPayments,
  adminRejectPayment,
} from "../../../services/admin/adminPayments";
import styles from "./AdminPayments.module.css";

export default function AdminPayments() {
  const [status, setStatus] = useState("pending_review");
  const [type, setType] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(""); // "view" | "reject"
  const [rejectReason, setRejectReason] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const list = await adminListPayments({ status, type });
      setItems(list);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, type]);

  const rows = useMemo(() => items || [], [items]);

  async function onApprove(id) {
    setErr("");
    try {
      await adminApprovePayment(id, note);
      setSelected(null);
      setModal("");
      setNote("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  }

  async function onReject(id) {
    setErr("");
    if (!rejectReason.trim()) {
      setErr("Reject reason is required");
      return;
    }
    try {
      await adminRejectPayment(id, rejectReason.trim());
      setSelected(null);
      setModal("");
      setRejectReason("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Payments</h1>

        <div className={styles.filters}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.select}>
            <option value="pending_review">pending_review</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} className={styles.select}>
            <option value="">all types</option>
            <option value="subscription">subscription</option>
            <option value="pack">pack</option>
          </select>

          <button className={styles.btn} onClick={load}>Refresh</button>
        </div>
      </div>

      {err ? <p className={styles.err}>{err}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Type</th>
              <th>Item</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Receipt</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="8" className={styles.muted}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="8" className={styles.muted}>No results</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                  <td>{p.payerName || "—"}</td>
                  <td>{p.type}</td>
                  <td>{p.itemCode}</td>
                  <td>{p.currency} {Number(p.amount).toFixed(2)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    {p.proofUrl ? (
                      <button
                        className={styles.linkBtn}
                        onClick={() => { setSelected(p); setModal("view"); }}
                      >
                        View
                      </button>
                    ) : "—"}
                  </td>
                  <td className={styles.actions}>

                    {p.status === "pending_review" ? (
                      <>
                        <button className={styles.approve} onClick={() => onApprove(p._id)}>Approve</button>
                        <button className={styles.reject} onClick={() => { setSelected(p); setModal("reject"); }}>
                          Reject
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={modal === "view"}
        title="Payment Details"
        onClose={() => { setModal(""); setSelected(null); }}
      >
        {!selected ? null : (
          <div className={styles.modalGrid}>
            <div className={styles.info}>
              <div><b>Status:</b> {selected.status}</div>
              <div><b>Type:</b> {selected.type}</div>
              <div><b>Item:</b> {selected.itemCode}</div>
              <div><b>Amount:</b> {selected.currency} {Number(selected.amount).toFixed(2)}</div>
              <div><b>Transfer Ref:</b> {selected.transferRef || "—"}</div>
              {selected.rejectionReason ? <div><b>Reason:</b> {selected.rejectionReason}</div> : null}
            </div>

            {selected.proofUrl ? (
              <a href={selected.proofUrl} target="_blank" rel="noreferrer" className={styles.receiptWrap}>
                <img src={selected.proofUrl} className={styles.receipt} alt="receipt" />
              </a>
            ) : null}
          </div>
        )}

        <div className={styles.noteRow}>
          <label className={styles.label}>Admin note</label>
          <input className={styles.input} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className={styles.modalActions}>
          {selected?.status === "pending_review" ? (
            <>
              <button className={styles.approve} onClick={() => onApprove(selected._id)}>Approve</button>
              <button className={styles.reject} onClick={() => { setModal("reject"); }}>Reject</button>
            </>
          ) : null}
          <button className={styles.smallBtn} onClick={() => { setModal(""); setSelected(null); }}>Close</button>
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "reject"}
        title="Reject Payment"
        onClose={() => { setModal(""); setRejectReason(""); }}
      >
        <label className={styles.label}>Reason </label>
        <textarea
          className={styles.textarea}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Example: Transfer not found / Wrong amount / Unclear receipt"
        />
        <div className={styles.modalActions}>
          <button className={styles.reject} onClick={() => onReject(selected._id)}>Reject</button>
          <button className={styles.smallBtn} onClick={() => { setModal(""); setRejectReason(""); }}>Cancel</button>
        </div>
      </AdminModal>
    </div>
  );
}
