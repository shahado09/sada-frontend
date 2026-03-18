import { useTranslation } from "react-i18next";
import styles from "./PlanCard.module.css";
import { formatBHD } from "../../../lib/money";

export default function PlanCard({ plan, onSubscribe }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const bhd = (plan.prices || []).find((p) => p.currency === "BHD");
  const name = (isAr && plan.nameAr) ? plan.nameAr : plan.name;
  const desc = (isAr && plan.descriptionAr) ? plan.descriptionAr : plan.description;

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{name}</h3>
        <div className={styles.price}>
          <div className={styles.amount}>{formatBHD(bhd?.amount)}</div>
          <div className={styles.per}>{isAr ? "/ شهر" : "/ month"}</div>
        </div>
      </div>

      {plan.salePriceBhd !== null && plan.salePriceBhd !== undefined && plan.salePriceBhd !== "" ? (
        <div>
          <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{plan.priceBhd} BHD</span>
          {"  "}
          <span style={{ fontWeight: 700 }}>{plan.currentPriceBhd} BHD</span>
        </div>
      ) : (
        <div><span style={{ fontWeight: 700 }}>{plan.currentPriceBhd} BHD</span></div>
      )}

      {desc ? <p className={styles.desc}>{desc}</p> : null}

      <div className={styles.pointsRow}>
        <span className={styles.points}>{plan.monthlyPoints}</span>
        <span className={styles.pointsLabel}>{isAr ? "نقطة / شهر" : "points / month"}</span>
      </div>

      <button className={styles.cta} onClick={() => onSubscribe(plan)}>
        {isAr ? "اشترك" : "Subscribe"}
      </button>
    </div>
  );
}