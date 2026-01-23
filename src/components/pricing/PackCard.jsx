import styles from "./PackCard.module.css";
import { formatBHD } from "../../lib/money";

export default function PackCard({ pack, onBuy }) {
  const price = pack.prices.find((p) => p.currency === "BHD");

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{pack.name}</h3>
        <div className={styles.price}>
          <span className={styles.amount}>{formatBHD(price?.amount)}</span>
        </div>
      </div>

      {pack.description && <p className={styles.desc}>{pack.description}</p>}

      <div className={styles.points}>
        <span className={styles.pointsValue}>{pack.points}</span>
        <span className={styles.pointsLabel}>points</span>
      </div>

      <button className={styles.cta} onClick={() => onBuy(pack)}>
        Buy
      </button>
    </div>
  );
}
