import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PackCard from "../../../components/pricing/PackCard";
import { fetchPacks } from "../../../services/packs";
import styles from "./PacksPage.module.css";

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPacks()
      .then(setPacks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Credit Packs</h1>
        <p className={styles.subtitle}>Need more credits? Top up anytime.</p>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading packs...</p>
      ) : (
        <div className={styles.grid}>
          {packs.map((pack) => (
            <PackCard
              key={pack._id}
              pack={pack}
              onBuy={(p) =>
                navigate("/payment/start", { state: { type: "pack", item: p } })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
