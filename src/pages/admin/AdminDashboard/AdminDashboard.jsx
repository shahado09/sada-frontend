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
  // عدّلي إذا عندكم status مختلف
  return v === "approved" || v === "paid" || v === "completed" || v === "success";
}

function isPendingStatus(s) {
  const v = String(s || "").toLowerCase();
  return v === "pending_review" || v === "pending" || v === "review";
}

function getPaymentDateISO(p) {
  // اختاري الموجود عندكم
  return p?.paidAt || p?.approvedAt || p?.createdAt || p?.updatedAt || null;
}

function isThisMonth(p) {
  const iso = getPaymentDateISO(p);
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const start = new Date(monthStartISO()).getTime();
  return t >= start;
}

function getKind(p) {
  // مرن حسب بياناتكم
  const k =
    p?.kind ||
    p?.type ||
    p?.paymentType ||
    p?.productType ||
    p?.metadata?.kind ||
    p?.meta?.kind;

  const v = String(k || "").toLowerCase();

  // fallback: وجود planId / packId
  if (v) return v;
  if (p?.planId || p?.plan || p?.subscriptionId) return "subscription";
  if (p?.packId || p?.pack) return "pack";
  return "other";
}

function getAmountBhd(p) {
  // مرن حسب بياناتكم
  const currency = String(p?.currency || p?.amount?.currency || p?.price?.currency || "BHD").toUpperCase();

  let amount =
    p?.amount ??
    p?.amountBhd ??
    p?.price ??
    p?.total ??
    p?.value ??
    p?.amount?.amount ??
    p?.price?.amount ??
    null;

  // لو amount جاي سترنق
  if (typeof amount === "string") amount = Number(amount);

  if (Number.isNaN(amount) || amount == null) return 0;

  // لو مو BHD، للحين نخليه 0 (MVP)
  if (currency !== "BHD") return 0;

  return Number(amount);
}

export default function AdminDashboard() {
  const [pending, setPending] = useState(0);

  const [approvedSubs, setApprovedSubs] = useState(0);
  const [approvedPacks, setApprovedPacks] = useState(0);

  const [revenueMonth, setRevenueMonth] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1) Pending (مثل ما عندج)
        const pendingItems = await adminListPayments({ status: "pending_review" });

        // 2) Approved list (نجيب approved عشان نحسب Subs + Packs + Revenue)
        // إذا API عندكم ما يدعم status=approved، تقدرين تشيلين البراميتر وتفلترين هنا
        const approvedItems = await adminListPayments({ status: "approved" }).catch(async () => {
          // fallback: جيبي الكل وفلتر
          const all = await adminListPayments({});
          return all.filter((x) => isApprovedStatus(x.status));
        });

        // فلترة الشهر الحالي
        const approvedThisMonth = approvedItems.filter((p) => isThisMonth(p));

        // Subs approved (تبين "أي أحد subscription approved يطلع")
        const subsApproved = approvedItems.filter(
          (p) => isApprovedStatus(p.status) && getKind(p).includes("sub")
        );

        // Packs approved
        const packsApproved = approvedItems.filter(
          (p) => isApprovedStatus(p.status) && getKind(p).includes("pack")
        );

        // Revenue Month (مجموع approved هذا الشهر)
        const revenue = approvedThisMonth
          .filter((p) => isApprovedStatus(p.status))
          .reduce((sum, p) => sum + getAmountBhd(p), 0);

        if (!mounted) return;

        setPending(pendingItems.length);
        setApprovedSubs(subsApproved.length);
        setApprovedPacks(packsApproved.length);
        setRevenueMonth(revenue);
      } catch (e) {
        if (!mounted) return;
        setPending(0);
        setApprovedSubs(0);
        setApprovedPacks(0);
        setRevenueMonth(0);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const revenueText = useMemo(() => {
    // عرض بسيط
    return `${revenueMonth.toFixed(3)} BHD`;
  }, [revenueMonth]);

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
