import styles from "./PlanCard.module.css";
import { formatBHD } from "../../../lib/money";

export default function PlanCard({ plan, onSubscribe }) {
  const bhd = (plan.prices || []).find((p) => p.currency === "BHD");
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{plan.name}</h3>
        <div className={styles.price}>
          <div className={styles.amount}>{formatBHD(bhd?.amount)}</div>
          <div className={styles.per}>/ month</div>
        </div>
      </div>
{plan.salePriceBhd !== null && plan.salePriceBhd !== undefined && plan.salePriceBhd !== "" ? (
  <div>
    <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
      {plan.priceBhd} BHD
    </span>
    {"  "}
    <span style={{ fontWeight: 700 }}>
      {plan.currentPriceBhd} BHD
    </span>
  </div>
) : (
  <div>
    <span style={{ fontWeight: 700 }}>{plan.currentPriceBhd} BHD</span>
  </div>
)}






      {plan.description ? <p className={styles.desc}>{plan.description}</p> : null}

      <div className={styles.pointsRow}>
        <span className={styles.points}>{plan.monthlyPoints}</span>
        <span className={styles.pointsLabel}>points / month</span>
      </div>

      <button className={styles.cta} onClick={() => onSubscribe(plan)}>
        Subscribe
      </button>
    </div>
  );
}
