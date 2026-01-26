import styles from "./PackCard.module.css";
import { formatBHD } from "../../../lib/money";

export default function PackCard({ pack, onBuy }) {
  const bhd = (pack.prices || []).find((p) => p.currency === "BHD");
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{pack.name}</h3>
        <div className={styles.amount}>{formatBHD(bhd?.amount)}</div>
      </div>
{pack.salePriceBhd != null ? (
  <div>
    <span style={{ textDecoration: "line-through", opacity: 0.6 }}>
      {pack.priceBhd} BHD
    </span>
    {"  "}
    <span style={{ fontWeight: 700 }}>
      {pack.currentPriceBhd} BHD
    </span>
  </div>
) : (
  <div>
    <span style={{ fontWeight: 700 }}>{pack.currentPriceBhd} BHD</span>
  </div>
)}

      {pack.description ? <p className={styles.desc}>{pack.description}</p> : null}

      <div className={styles.pointsRow}>
        <span className={styles.points}>{pack.points}</span>
        <span className={styles.pointsLabel}>points</span>
      </div>

      <button className={styles.cta} onClick={() => onBuy(pack)}>
        Buy
      </button>
    </div>
  );
}
