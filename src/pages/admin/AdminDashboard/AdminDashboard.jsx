import { useEffect, useMemo, useState } from "react";
import { adminListPayments } from "../../../services/admin/adminPayments";
import styles from "./AdminDashboard.module.css";

function monthStartISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isApprovedStatus(s) {
  const v = String(s || "").toLowerCase();
  return v === "approved" || v === "paid" || v === "completed" || v === "success";
}

function getPaymentDateISO(p) {
  return p?.reviewedAt || p?.paidAt || p?.approvedAt || p?.updatedAt || p?.createdAt || null;
}

function isThisMonth(p) {
  const iso = getPaymentDateISO(p);
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const start = new Date(monthStartISO()).getTime();
  return t >= start;
}

function getKind(p) {
  const k = p?.kind || p?.type || p?.paymentType || p?.productType || "";
  const v = String(k || "").toLowerCase();
  if (v) return v;
  if (p?.planId || p?.plan || p?.subscriptionId) return "subscription";
  if (p?.packId || p?.pack) return "pack";
  return "other";
}

// ✅ FIX: الباك اند يحفظ amountBHD (كبير) مو amountBhd
function getAmountBhd(p) {
  let amount =
    p?.amountBHD ??   // ✅ الصح
    p?.amountBhd ??   // fallback
    p?.amount ??
    p?.price ??
    p?.total ??
    null;

  if (typeof amount === "string") amount = Number(amount);
  if (Number.isNaN(amount) || amount == null) return 0;
  return Number(amount);
}

export default function AdminDashboard() {
  const [pending, setPending]         = useState(0);
  const [approvedSubs, setApprovedSubs]   = useState(0);
  const [approvedPacks, setApprovedPacks] = useState(0);
  const [revenueMonth, setRevenueMonth]   = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const pendingItems = await adminListPayments({ status: "pending_review" });

        // ✅ FIX: جيب كل الـ approved بدون حد زمني عشان يحسب الإجماليات
        const approvedItems = await adminListPayments({ status: "approved" }).catch(async () => {
          const all = await adminListPayments({});
          return all.filter((x) => isApprovedStatus(x.status));
        });

        const approvedThisMonth = approvedItems.filter((p) => isThisMonth(p));

        const subsApproved  = approvedItems.filter((p) => getKind(p).includes("sub"));
        const packsApproved = approvedItems.filter((p) => getKind(p).includes("pack"));

        // ✅ FIX: حساب الـ revenue الصح
        const revenue = approvedThisMonth.reduce((sum, p) => sum + getAmountBhd(p), 0);

        if (!mounted) return;
        setPending(pendingItems.length);
        setApprovedSubs(subsApproved.length);
        setApprovedPacks(packsApproved.length);
        setRevenueMonth(revenue);
      } catch {
        if (!mounted) return;
        setPending(0); setApprovedSubs(0); setApprovedPacks(0); setRevenueMonth(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const revenueText = useMemo(() => `${revenueMonth.toFixed(3)} BHD`, [revenueMonth]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.kpiLabel}>Pending Payments</div>
          <div className={styles.kpiValue}>{loading ? "…" : pending}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.kpiLabel}>Approved Subscriptions</div>
          <div className={styles.kpiValue}>{loading ? "…" : approvedSubs}</div>
          <div className={styles.hint}>Total approved subscription payments</div>
        </div>

        <div className={styles.card}>
          <div className={styles.kpiLabel}>Approved Packs</div>
          <div className={styles.kpiValue}>{loading ? "…" : approvedPacks}</div>
          <div className={styles.hint}>Total approved pack payments</div>
        </div>

        <div className={styles.card}>
          <div className={styles.kpiLabel}>Revenue (Month)</div>
          <div className={styles.kpiValue}>{loading ? "…" : revenueText}</div>
          <div className={styles.hint}>Approved payments in current month (BHD)</div>
        </div>
      </div>
    </div>
  );
}
