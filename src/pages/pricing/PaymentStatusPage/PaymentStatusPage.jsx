import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPaymentIntent, resubmitPaymentIntent } from "../../../services/payments";
import styles from "./PaymentStatusPage.module.css";

export default function PaymentStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [intent, setIntent] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try { const i = await getPaymentIntent(id); if (alive) setIntent(i); }
      catch (e) { if (alive) setErr(e?.response?.data?.message || e.message); }
    }
    load();
    const timer = setInterval(load, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [id]);

  async function onResubmit() {
    setErr("");
    try { const newIntent = await resubmitPaymentIntent(id); navigate(`/payment/${newIntent._id}`); }
    catch (e) { setErr(e?.response?.data?.message || e.message); }
  }

  if (err && !intent) return <div className={styles.page}><p className={styles.err}>{err}</p></div>;
  if (!intent) return <div className={styles.page}>{t("payment.loading")}</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("payment.statusTitle")}</h1>
      <div className={styles.card}>
        <div className={styles.row}>
          <span>{t("payment.status")}</span>
          <strong>{t(`profile.statuses.${intent.status}`, { defaultValue: intent.status })}</strong>
        </div>

        {intent.status === "pending_review" && (
          <p className={styles.msg}>{t("payment.pendingMsg")}</p>
        )}

        {intent.status === "approved" && (
          <div>
            <p className={styles.ok}>{t("payment.approvedMsg")}</p>
            <button className={styles.btn} onClick={() => navigate("/dashboard")}>{t("payment.goToDashboard")}</button>
          </div>
        )}

        {intent.status === "rejected" && (
          <div>
            <p className={styles.err}>{t("payment.rejectedMsg")}</p>
            <p className={styles.reason}>{t("payment.rejectedReason")} {intent.rejectionReason || t("payment.noReason")}</p>
            <button className={styles.btn} onClick={onResubmit}>{t("payment.resubmit")}</button>
          </div>
        )}

        {err && <p className={styles.err}>{err}</p>}
      </div>
    </div>
  );
}