import { useLocation, useNavigate } from "react-router-dom";
import styles from "./PaymentStartPage.module.css";

export default function PaymentStartPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className={styles.page}>
        <p className={styles.msg}>No payment request found.</p>
        <button className={styles.btn} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { type, item } = state;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payment</h1>

      <div className={styles.box}>
        <p className={styles.row}>
          <span className={styles.label}>{type === "subscription" ? "Plan" : "Pack"}</span>
          <span className={styles.value}>{item.name}</span>
        </p>

      </div>

      <div className={styles.actions}>
        <button className={styles.btnGhost} onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
}
