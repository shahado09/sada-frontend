import { useTranslation } from "react-i18next";
import styles from "./PackCard.module.css";
import { formatBHD } from "../../../lib/money";

export default function PackCard({ pack, onBuy }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const bhd = (pack.prices || []).find((p) => p.currency === "BHD");
  const name = (isAr && pack.nameAr) ? pack.nameAr : pack.name;
  const desc = (isAr && pack.descriptionAr) ? pack.descriptionAr : pack.description;

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{name}</h3>
        <div className={styles.amount}>{formatBHD(bhd?.amount)}</div>
      </div>

      {pack.salePriceBhd != null ? (
        <div>
          <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{pack.priceBhd} BHD</span>
          {"  "}
          <span style={{ fontWeight: 700 }}>{pack.currentPriceBhd} BHD</span>
        </div>
      ) : (
        <div><span style={{ fontWeight: 700 }}>{pack.currentPriceBhd} BHD</span></div>
      )}

      {desc ? <p className={styles.desc}>{desc}</p> : null}

      <div className={styles.pointsRow}>
        <span className={styles.points}>{pack.points}</span>
        <span className={styles.pointsLabel}>{isAr ? "نقطة" : "points"}</span>
      </div>

      <button className={styles.cta} onClick={() => onBuy(pack)}>
        {isAr ? "اشتري" : "Buy"}
      </button>
    </div>
  );
}