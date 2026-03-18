import { useEffect, useState, useCallback } from "react";
import { adminListPayments } from "../../../services/admin/adminPayments";
import api from "../../../api/api";
import styles from "./AdminDashboard.module.css";

function fmtBHD(n) { return `${Number(n || 0).toFixed(3)} BD`; }
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getAmountBhd(p) {
  let a = p?.amountBHD ?? p?.amountBhd ?? p?.amount ?? 0;
  return isNaN(Number(a)) ? 0 : Number(a);
}

function getKind(p) {
  const v = String(p?.kind || p?.type || "").toLowerCase();
  if (v.includes("sub")) return "subscription";
  if (v.includes("pack")) return "pack";
  return "other";
}

function monthStart() {
  const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
}

function last6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); d.setHours(0,0,0,0);
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString("en-US", { month: "short" }), start: new Date(d), revenue: 0 });
  }
  return months;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    totalUsers: 0,
    revenueMonth: 0,
    revenueTotal: 0,
    subsTotal: 0,
    packsTotal: 0,
    recentPayments: [],
    chartData: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingItems, approvedItems, usersRes] = await Promise.all([
        adminListPayments({ status: "pending_review" }).catch(() => []),
        adminListPayments({ status: "approved" }).catch(() => []),
        api.get("/admin/users?limit=1").catch(() => ({ data: { total: 0 } })),
      ]);

      const ms = monthStart();
      const revenueMonth = approvedItems
        .filter(p => new Date(p.reviewedAt || p.updatedAt) >= ms)
        .reduce((s, p) => s + getAmountBhd(p), 0);

      const revenueTotal = approvedItems.reduce((s, p) => s + getAmountBhd(p), 0);
      const subsTotal = approvedItems.filter(p => getKind(p) === "subscription").length;
      const packsTotal = approvedItems.filter(p => getKind(p) === "pack").length;

      // Chart — last 6 months
      const chart = last6Months();
      approvedItems.forEach(p => {
        const d = new Date(p.reviewedAt || p.updatedAt || p.createdAt);
        chart.forEach(m => {
          const end = new Date(m.start);
          end.setMonth(end.getMonth() + 1);
          if (d >= m.start && d < end) m.revenue += getAmountBhd(p);
        });
      });

      const maxRev = Math.max(...chart.map(m => m.revenue), 1);

      setStats({
        pending: pendingItems.length,
        totalUsers: usersRes.data?.total || 0,
        revenueMonth,
        revenueTotal,
        subsTotal,
        packsTotal,
        recentPayments: approvedItems.slice(0, 6),
        chartData: chart.map(m => ({ ...m, pct: (m.revenue / maxRev) * 100 })),
      });
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const KPI = ({ label, value, sub, accent }) => (
    <div className={`${styles.kpiCard} ${accent ? styles.kpiAccent : ""}`}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{loading ? <span className={styles.skeleton} /> : value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Overview of your platform performance</p>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* KPIs Row */}
      <div className={styles.kpiGrid}>
        <KPI label="Total Revenue" value={fmtBHD(stats.revenueTotal)} sub="All time" accent />
        <KPI label="Revenue This Month" value={fmtBHD(stats.revenueMonth)} sub={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} />
        <KPI label="Total Users" value={stats.totalUsers} sub="Registered accounts" />
        <KPI label="Pending Payments" value={stats.pending} sub={stats.pending > 0 ? "Needs attention" : "All clear"} />
        <KPI label="Subscriptions Sold" value={stats.subsTotal} sub="Total approved" />
        <KPI label="Packs Sold" value={stats.packsTotal} sub="Total approved" />
      </div>

      {/* Chart + Recent */}
      <div className={styles.bottomGrid}>

        {/* Revenue Chart */}
        <div className={styles.chartCard}>
          <div className={styles.cardHead}>
            <span>Monthly Revenue</span>
            <span className={styles.cardHeadSub}>Last 6 months (BHD)</span>
          </div>
          <div className={styles.chart}>
            {stats.chartData.map((m, i) => (
              <div key={i} className={styles.barWrap}>
                <div className={styles.barLabel}>{fmtBHD(m.revenue)}</div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ height: loading ? "20%" : `${Math.max(m.pct, 4)}%` }}
                  />
                </div>
                <div className={styles.barMonth}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className={styles.recentCard}>
          <div className={styles.cardHead}>
            <span>Recent Approved</span>
            <span className={styles.cardHeadSub}>Latest 6</span>
          </div>
          {loading ? (
            <div className={styles.recentEmpty}>Loading...</div>
          ) : stats.recentPayments.length === 0 ? (
            <div className={styles.recentEmpty}>No approved payments yet.</div>
          ) : (
            <div className={styles.recentList}>
              {stats.recentPayments.map((p, i) => (
                <div key={i} className={styles.recentRow}>
                  <div className={styles.recentIcon}>
                    {getKind(p) === "subscription" ? "⭐" : "📦"}
                  </div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentCode}>{p.itemCode}</div>
                    <div className={styles.recentDate}>{fmtDate(p.reviewedAt || p.updatedAt || p.createdAt)}</div>
                  </div>
                  <div className={styles.recentAmount}>{fmtBHD(getAmountBhd(p))}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}