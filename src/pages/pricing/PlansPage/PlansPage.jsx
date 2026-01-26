import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanCard from "../../../components/pricing/PlanCard/PlanCard";
import { fetchPlans } from "../../../services/plans";
import styles from "./PlansPage.module.css";
import PricingTabs from "../../../components/PricingTabs/PricingTabs";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
    
      <header className={styles.header}>
        <h1 className={styles.title}>Choose a plan</h1>
        <PricingTabs />
        <p className={styles.sub}>Subscribe for monthly credits & features.</p>
      </header>

      {loading ? (
        <p className={styles.msg}>Loading...</p>
      ) : (
        <div className={styles.grid}>
          {plans.map((p) => (
            <PlanCard
              key={p._id}
              plan={p}
              onSubscribe={(plan) =>
                navigate("/payment/start", { state: { type: "subscription", itemCode: plan.code } })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
