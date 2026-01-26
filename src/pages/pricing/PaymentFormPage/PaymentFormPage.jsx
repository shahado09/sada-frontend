import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPaymentIntent, submitPaymentProof } from "../../../services/payments";
import { getCloudinarySignature, uploadReceiptToCloudinary } from "../../../services/uploads";
import { formatBHD } from "../../../lib/money";
import styles from "./PaymentFormPage.module.css";

export default function PaymentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [intent, setIntent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [payerName, setPayerName] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    getPaymentIntent(id)
      .then((i) => setIntent(i))
      .catch((e) => setErr(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!payerName.trim()) return setErr("Please enter your name");
    if (!file) return setErr("Please upload the receipt image");

    setSubmitting(true);
    try {
      const sig = await getCloudinarySignature();
      const proofImageUrl = await uploadReceiptToCloudinary(file, sig);

      await submitPaymentProof(id, {
        payerName: payerName.trim(),
        transferRef: transferRef.trim() || undefined,
        proofImageUrl,
      });

      navigate(`/payment/request/${id}`);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className={styles.page}><div className={styles.center}>Loading...</div></div>;
  if (err && !intent) return <div className={styles.page}><div className={styles.center}><p className={styles.err}>{err}</p></div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Manual Transfer</h1>
          <p className={styles.sub}>Upload your receipt so we can review and approve your credits.</p>
        </header>

        <div className={styles.infoCard}>
          <div className={styles.row}>
            <span className={styles.label}>Type</span>
            <span className={styles.value}>{intent.type}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Item</span>
            <span className={styles.value}>{intent.itemCode}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Amount</span>
            <span className={styles.value}>{formatBHD(intent.amountBHD)}</span>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Form */}
          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Your name</span>
              <input
                className={styles.input}
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Full name"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Transfer reference (optional)</span>
              <input
                className={styles.input}
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="BenefitPay ref..."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Receipt image</span>

              <div className={styles.uploadRow}>
                <input
                  className={styles.file}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <span className={styles.fileHint}>
                  JPG/PNG • clear screenshot recommended
                </span>
              </div>
            </label>

            {err ? <p className={styles.err}>{err}</p> : null}

            <button className={styles.btn} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.ghost}`}
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Back
            </button>
          </form>

          {/* Preview */}
          <aside className={styles.preview}>
            <div className={styles.previewCard}>
              <div className={styles.previewTop}>
                <div className={styles.previewTitle}>Preview</div>
                <div className={styles.previewNote}>Check the image before submitting</div>
              </div>

              {previewUrl ? (
                <img className={styles.previewImg} src={previewUrl} alt="Receipt preview" />
              ) : (
                <div className={styles.previewEmpty}>
                  <div className={styles.previewIcon}>🧾</div>
                  <div className={styles.previewText}>No image selected</div>
                  <div className={styles.previewSub}>Choose a receipt photo to preview it here.</div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
