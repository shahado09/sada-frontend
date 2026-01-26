import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PackCard from "../../../components/pricing/PackCard/PackCard";
import { fetchPacks } from "../../../services/packs";
import PricingTabs from "../../../components/PricingTabs/PricingTabs";
import styles from "./PacksPage.module.css";

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPacks().then(setPacks).finally(() => setLoading(false));
  }, []);

  return (

    <div className={styles.page}>

      <header className={styles.header}>
        <h1 className={styles.title}>Add credits</h1>
        <PricingTabs />
        <p className={styles.sub}>Add credit packs from $5.00</p>
      </header>
      {loading ? (
        <p className={styles.msg}>Loading...</p>
      ) : (
        <div className={styles.grid}>
          {packs.map((p) => (
            <PackCard
              key={p._id}
              pack={p}
              onBuy={(pack) =>
                navigate("/payment/start", { state: { type: "pack", itemCode: pack.code } })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
