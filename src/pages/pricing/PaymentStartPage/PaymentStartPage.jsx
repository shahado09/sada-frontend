import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPaymentIntent } from "../../../services/payments";
import styles from "./PaymentStartPage.module.css";

export default function PaymentStartPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!state?.type || !state?.itemCode) {
    navigate("/plans", { replace: true });
    return;
    } 
    console.log("PAYMENT START state:", state);
    createPaymentIntent({ type: state.type, itemCode: state.itemCode })
      .then((intent) => navigate(`/payment/${intent._id}`, { replace: true }))
      .catch((e) => setErr(e?.response?.data?.message || e.message));
  }, [state, navigate]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Preparing payment...</h1>
      {err ? <p className={styles.err}>{err}</p> : <p className={styles.msg}>Please wait</p>}
    </div>
  );
}
