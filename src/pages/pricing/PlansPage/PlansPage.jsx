import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PlanCard from "../../../components/pricing/PlanCard/PlanCard";
import { fetchPlans } from "../../../services/plans";
import styles from "./PlansPage.module.css";
import PricingTabs from "../../../components/PricingTabs/PricingTabs";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("plans.title")}</h1>
        <PricingTabs />
        <p className={styles.sub}>{t("plans.sub")}</p>
      </header>
      {loading ? <p className={styles.msg}>{t("plans.loading")}</p> : (
        <div className={styles.grid}>
          {plans.map((p) => (
            <PlanCard key={p._id} plan={p}
              onSubscribe={(plan) => navigate("/payment/start", { state: { type: "subscription", itemCode: plan.code } })} />
          ))}
        </div>
      )}
    </div>
  );
}