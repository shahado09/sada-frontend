import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPaymentIntent } from "../../../services/payments";
import styles from "./PaymentStartPage.module.css";

export default function PaymentStartPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!state?.type || !state?.itemCode) { navigate("/plans", { replace: true }); return; }
    createPaymentIntent({ type: state.type, itemCode: state.itemCode })
      .then((intent) => navigate(`/payment/${intent._id}`, { replace: true }))
      .catch((e) => setErr(e?.response?.data?.message || e.message));
  }, [state, navigate]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("payment.preparing")}</h1>
      {err ? <p className={styles.err}>{err}</p> : <p className={styles.msg}>{t("payment.pleaseWait")}</p>}
    </div>
  );
}