import styles from "./StatusBadge.module.css";

export default function StatusBadge({ status }) {
  const cls =
    status === "approved" ? styles.ok :
    status === "rejected" ? styles.bad :
    status === "pending_review" ? styles.warn :
    styles.neutral;

  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}
