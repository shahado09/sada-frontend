import styles from "./PlanCard.module.css";
import { formatBHD } from "../../lib/money";

export default function PlanCard({ plan, onSubscribe }) {
  const price = plan.prices.find((p) => p.currency === "BHD");

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{plan.name}</h3>
        <div className={styles.price}>
          <span className={styles.amount}>{formatBHD(price?.amount)}</span>
          <span className={styles.per}>/month</span>
        </div>
      </div>

      {plan.description && <p className={styles.desc}>{plan.description}</p>}

      <div className={styles.points}>
        <span className={styles.pointsValue}>{plan.monthlyPoints}</span>
        <span className={styles.pointsLabel}>points / month</span>
      </div>

      <button className={styles.cta} onClick={() => onSubscribe(plan)}>
        Subscribe
      </button>
    </div>
  );
}
