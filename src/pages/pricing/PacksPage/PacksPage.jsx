import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PackCard from "../../../components/pricing/PackCard/PackCard";
import { fetchPacks } from "../../../services/packs";
import PricingTabs from "../../../components/PricingTabs/PricingTabs";
import styles from "./PacksPage.module.css";

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchPacks().then(setPacks).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("packs.title")}</h1>
        <PricingTabs />
        <p className={styles.sub}>{t("packs.sub")}</p>
      </header>
      {loading ? <p className={styles.msg}>{t("packs.loading")}</p> : (
        <div className={styles.grid}>
          {packs.map((p) => (
            <PackCard key={p._id} pack={p}
              onBuy={(pack) => navigate("/payment/start", { state: { type: "pack", itemCode: pack.code } })} />
          ))}
        </div>
      )}
    </div>
  );
}