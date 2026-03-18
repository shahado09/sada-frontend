import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPaymentIntent, submitPaymentProof } from "../../../services/payments";
import { getCloudinarySignature, uploadReceiptToCloudinary } from "../../../services/uploads";
import { formatBHD } from "../../../lib/money";
import styles from "./PaymentFormPage.module.css";

export default function PaymentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [intent, setIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payerName, setPayerName] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const previewUrl = useMemo(() => { if (!file) return ""; return URL.createObjectURL(file); }, [file]);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  useEffect(() => {
    getPaymentIntent(id).then((i) => setIntent(i)).catch((e) => setErr(e?.response?.data?.message || e.message)).finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!payerName.trim()) return setErr(t("payment.yourName") + " required");
    if (!file) return setErr(t("payment.receiptImage") + " required");
    setSubmitting(true);
    try {
      const sig = await getCloudinarySignature();
      const proofImageUrl = await uploadReceiptToCloudinary(file, sig);
      await submitPaymentProof(id, { payerName: payerName.trim(), transferRef: transferRef.trim() || undefined, proofImageUrl });
      navigate(`/payment/request/${id}`);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message);
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className={styles.page}><div className={styles.center}>{t("payment.loading")}</div></div>;
  if (err && !intent) return <div className={styles.page}><div className={styles.center}><p className={styles.err}>{err}</p></div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("payment.manualTransfer")}</h1>
          <p className={styles.sub}>{t("payment.uploadReceipt")}</p>
        </header>

        <div className={styles.infoCard}>
          <div className={styles.row}><span className={styles.label}>{t("profile.type")}</span><span className={styles.value}>{intent.type}</span></div>
          <div className={styles.row}><span className={styles.label}>{t("profile.item")}</span><span className={styles.value}>{intent.itemCode}</span></div>
          <div className={styles.row}><span className={styles.label}>{t("profile.amount")}</span><span className={styles.value}>{formatBHD(intent.amountBHD)}</span></div>
          <div className={styles.row}><span className={styles.label}>{t("IBAN")}</span><span className={styles.value}>BH84BIBB00200003972812</span></div>
        </div>

        <div className={styles.layout}>
          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t("payment.yourName")}</span>
              <input className={styles.input} value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder={t("payment.fullName")} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t("payment.transferRef")}</span>
              <input className={styles.input} value={transferRef} onChange={(e) => setTransferRef(e.target.value)} placeholder="BenefitPay ref..." />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t("payment.receiptImage")}</span>
              <div className={styles.uploadRow}>
                <input className={styles.file} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <span className={styles.fileHint}>JPG/PNG</span>
              </div>
            </label>
            {err ? <p className={styles.err}>{err}</p> : null}
            <button className={styles.btn} disabled={submitting}>{submitting ? t("payment.submitting") : t("payment.submit")}</button>
            <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={() => navigate(-1)} disabled={submitting}>{t("payment.back")}</button>
          </form>

          <aside className={styles.preview}>
            <div className={styles.previewCard}>
              <div className={styles.previewTop}>
                <div className={styles.previewTitle}>{t("payment.preview")}</div>
                <div className={styles.previewNote}>{t("payment.previewNote")}</div>
              </div>
              {previewUrl ? (
                <img className={styles.previewImg} src={previewUrl} alt="Receipt preview" />
              ) : (
                <div className={styles.previewEmpty}>
                  <div className={styles.previewIcon}>🧾</div>
                  <div className={styles.previewText}>{t("payment.noImage")}</div>
                  <div className={styles.previewSub}>{t("payment.choosePhoto")}</div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}