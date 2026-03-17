import { useEffect, useState, useCallback } from "react";
import api from "../../../api/api";
import styles from "./AdminLedger.module.css";

const REASON_LABELS = {
  pack_purchase:       { label: "Pack Purchase",       color: "green" },
  subscription_grant:  { label: "Subscription Grant",  color: "green" },
  generation_spend:    { label: "Generation",           color: "red"   },
  refund:              { label: "Refund",               color: "blue"  },
  manual_adjustment:   { label: "Manual Adjustment",   color: "gray"  },
};

const TYPE_LABELS = {
  credit: { label: "Credit ↑", color: "green" },
  debit:  { label: "Debit ↓",  color: "red"   },
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Badge({ type, label }) {
  return <span className={`${styles.badge} ${styles[`badge_${type}`]}`}>{label}</span>;
}

export default function AdminLedger() {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState("");

  // filters
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId]       = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [reasonFilter, setReasonFilter] = useState("");

  // pagination
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 30;

  // stats
  const [stats, setStats] = useState(null);

  // user info when viewing a specific user
  const [userInfo, setUserInfo] = useState(null);

  // ─── load stats ─────────────────────────────────────────────────
  useEffect(() => {
    api.get("/admin/ledger/stats")
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  // ─── load entries ────────────────────────────────────────────────
  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setErr("");
    try {
      let url = "";
      let params = new URLSearchParams({ page: p, limit: LIMIT });
      if (typeFilter)   params.set("type", typeFilter);
      if (reasonFilter) params.set("reason", reasonFilter);

      if (userId) {
        url = `/admin/ledger/users/${userId}?${params}`;
      } else {
        url = `/admin/ledger/users/${userId || "all"}?${params}`;
      }

      const res = await api.get(url);
      setEntries(res.data.entries || []);
      setTotal(res.data.pagination?.total || 0);
      setPages(res.data.pagination?.pages || 1);
      setUserInfo(res.data.user || null);
      setPage(p);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [userId, typeFilter, reasonFilter]);

  // ─── search by email ─────────────────────────────────────────────
  async function searchUser() {
    if (!userEmail.trim()) {
      setUserId("");
      setUserInfo(null);
      return;
    }
    setErr("");
    try {
      const res = await api.get(`/admin/users?email=${encodeURIComponent(userEmail.trim())}`);
      const users = res.data?.users || res.data?.items || [];
      const found = users[0];
      if (!found) { setErr("User not found"); return; }
      setUserId(String(found._id || found.id));
      setUserInfo(found);
    } catch (e) {
      setErr(e?.response?.data?.message || "User not found");
    }
  }

  useEffect(() => {
    if (userId) load(1);
  }, [userId, typeFilter, reasonFilter]);

  function clearUser() {
    setUserId("");
    setUserEmail("");
    setUserInfo(null);
    setEntries([]);
    setTotal(0);
    setPages(1);
  }

  // ─── stats summary ───────────────────────────────────────────────
  const monthCredit = stats?.thisMonth?.find(s => s._id === "credit")?.totalPoints ?? 0;
  const monthDebit  = stats?.thisMonth?.find(s => s._id === "debit")?.totalPoints  ?? 0;
  const allCredit   = stats?.allTime?.filter(s => s._id.type === "credit").reduce((a, b) => a + b.totalPoints, 0) ?? 0;
  const allDebit    = stats?.allTime?.filter(s => s._id.type === "debit").reduce((a, b) => a + b.totalPoints, 0) ?? 0;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ledger</h1>
          <p className={styles.sub}>Credits history across all users</p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>This Month — Granted</div>
            <div className={`${styles.statValue} ${styles.green}`}>+{monthCredit.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>This Month — Spent</div>
            <div className={`${styles.statValue} ${styles.red}`}>−{monthDebit.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>All Time — Granted</div>
            <div className={`${styles.statValue} ${styles.green}`}>+{allCredit.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>All Time — Spent</div>
            <div className={`${styles.statValue} ${styles.red}`}>−{allDebit.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className={styles.filters}>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            placeholder="Search by email…"
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchUser()}
          />
          <button className={styles.btn} onClick={searchUser}>Search</button>
          {userId && <button className={styles.btnGhost} onClick={clearUser}>Clear</button>}
        </div>

        <div className={styles.filterRow}>
          <select className={styles.select} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); }}>
            <option value="">All Types</option>
            <option value="credit">Credit ↑</option>
            <option value="debit">Debit ↓</option>
          </select>

          <select className={styles.select} value={reasonFilter} onChange={e => { setReasonFilter(e.target.value); }}>
            <option value="">All Reasons</option>
            <option value="pack_purchase">Pack Purchase</option>
            <option value="subscription_grant">Subscription Grant</option>
            <option value="generation_spend">Generation</option>
            <option value="refund">Refund</option>
            <option value="manual_adjustment">Manual Adjustment</option>
          </select>
        </div>
      </div>

      {/* ── User Info Bar ── */}
      {userInfo && (
        <div className={styles.userBar}>
          <span className={styles.userEmail}>{userInfo.email}</span>
          <span className={styles.userCredits}>
            Current balance: <strong>{userInfo.credits ?? "—"} credits</strong>
          </span>
        </div>
      )}

      {err && <div className={styles.err}>{err}</div>}

      {/* ── Prompt to search ── */}
      {!userId && !loading && (
        <div className={styles.empty}>
          Search for a user by email to view their ledger history.
        </div>
      )}

      {/* ── Table ── */}
      {userId && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Points</th>
                  <th>Ref ID</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className={styles.center}>Loading…</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={5} className={styles.center}>No entries found</td></tr>
                ) : entries.map(e => (
                  <tr key={e._id}>
                    <td className={styles.mono}>{fmt(e.createdAt)}</td>
                    <td>
                      <Badge
                        type={TYPE_LABELS[e.type]?.color || "gray"}
                        label={TYPE_LABELS[e.type]?.label || e.type}
                      />
                    </td>
                    <td>
                      <Badge
                        type={REASON_LABELS[e.reason]?.color || "gray"}
                        label={REASON_LABELS[e.reason]?.label || e.reason}
                      />
                    </td>
                    <td className={`${styles.points} ${e.type === "credit" ? styles.green : styles.red}`}>
                      {e.type === "credit" ? "+" : "−"}{e.points}
                    </td>
                    <td className={styles.mono} title={e.refId}>
                      {e.refId ? String(e.refId).slice(-8) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.btnGhost} onClick={() => load(page - 1)} disabled={page <= 1}>← Prev</button>
              <span className={styles.pageInfo}>Page {page} of {pages} ({total} entries)</span>
              <button className={styles.btnGhost} onClick={() => load(page + 1)} disabled={page >= pages}>Next →</button>
            </div>
          )}

          {!loading && entries.length > 0 && pages <= 1 && (
            <div className={styles.totalRow}>{total} entr{total === 1 ? "y" : "ies"}</div>
          )}
        </>
      )}
    </div>
  );
}
