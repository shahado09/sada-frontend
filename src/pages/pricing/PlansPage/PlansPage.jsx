import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PlanCard from "../../../components/pricing/PlanCard";
import { fetchPlans } from "../../../services/plans";

import styles from "./PlansPage.module.css";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Plans</h1>
        <p className={styles.subtitle}>Choose a plan to start generating</p>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading plans...</p>
      ) : (
        <div className={styles.grid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onSubscribe={(p) =>
                navigate("/payment/start", { state: { type: "subscription", item: p } })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
