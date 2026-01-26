import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPaymentIntent, resubmitPaymentIntent } from "../../../services/payments";
import styles from "./PaymentStatusPage.module.css";

export default function PaymentStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intent, setIntent] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const i = await getPaymentIntent(id);
        if (alive) setIntent(i);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || e.message);
      }
    }

    load();
    const t = setInterval(load, 5000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  async function onResubmit() {
    setErr("");
    try {
      const newIntent = await resubmitPaymentIntent(id);
      navigate(`/payment/${newIntent._id}`);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  }

  if (err && !intent) return <div className={styles.page}><p className={styles.err}>{err}</p></div>;
  if (!intent) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payment Status</h1>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>Status</span>
          <strong>{intent.status}</strong>
        </div>

        {intent.status === "pending_review" ? (
          <p className={styles.msg}>We received your request. Waiting for approval.</p>
        ) : null}

        {intent.status === "approved" ? (
          <div>
            <p className={styles.ok}>Approved ✅ Points added.</p>
            <button className={styles.btn} onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
          </div>
        ) : null}

        {intent.status === "rejected" ? (
          <div>
            <p className={styles.err}>Rejected ❌</p>
            <p className={styles.reason}>Reason: {intent.rejectionReason || "No reason provided"}</p>
            <button className={styles.btn} onClick={onResubmit}>Resubmit</button>
          </div>
        ) : null}

        {err ? <p className={styles.err}>{err}</p> : null}
      </div>
    </div>
  );
}
