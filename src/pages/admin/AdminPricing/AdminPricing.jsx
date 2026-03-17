import { useEffect, useState } from "react";
import api from "../../../api/api";
import styles from "./AdminPricing.module.css";

const VIDEO_DURATIONS = [5, 10, 15, 30, 60];
const VIDEO_MODELS = [
  { key: "kling", label: "Kling (Fashion · Creator)" },
  { key: "veo",   label: "Veo (Product)" },
];

export default function AdminPricing() {
  const [videoPricing, setVideoPricing] = useState({ kling: {}, veo: {} });
  const [imagePricing, setImagePricing] = useState({ t2i_normal: 2, t2i_high: 4, i2i_normal: 3, i2i_high: 6 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [vRes, iRes] = await Promise.all([
        api.get("/admin/pricing/video"),
        api.get("/admin/pricing/image"),
      ]);
      setVideoPricing(vRes.data.pricing || { kling: {}, veo: {} });
      setImagePricing(iRes.data.pricing || { t2i_normal: 2, t2i_high: 4, i2i_normal: 3, i2i_high: 6 });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function setVideoCredit(model, duration, value) {
    setVideoPricing((prev) => ({
      ...prev,
      [model]: { ...prev[model], [duration]: Number(value) || 0 },
    }));
  }

  function setImageCredit(key, value) {
    setImagePricing((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      await Promise.all([
        api.put("/admin/pricing/video", { pricing: videoPricing }),
        api.put("/admin/pricing/image", { pricing: imagePricing }),
      ]);
      setMsg("Saved successfully");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.page}><div className={styles.loading}>Loading...</div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Pricing</h1>
          <div className={styles.sub}>Set credit costs for image and video generation</div>
        </div>
        <button className={styles.saveBtn} onClick={save} disabled={saving} type="button">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {err && <div className={styles.error}>{err}</div>}
      {msg && <div className={styles.success}>{msg}</div>}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Image Generation</div>
        <div className={styles.sectionSub}>Credits charged per image</div>

        <div className={styles.modelBlock}>
          <div className={styles.modelLabel}>Text → Image</div>
          <div className={styles.row}>
            <div className={styles.priceCard}>
              <div className={styles.priceLabel}>Normal Quality</div>
              <div className={styles.priceDesc}>2K resolution</div>
              <input type="number" min={1} className={styles.priceInput}
                value={imagePricing.t2i_normal ?? 2}
                onChange={(e) => setImageCredit("t2i_normal", e.target.value)}
                disabled={saving} />
              <div className={styles.priceUnit}>credits</div>
            </div>
            <div className={styles.priceCard}>
              <div className={styles.priceLabel}>High Quality</div>
              <div className={styles.priceDesc}>4K resolution</div>
              <input type="number" min={1} className={styles.priceInput}
                value={imagePricing.t2i_high ?? 4}
                onChange={(e) => setImageCredit("t2i_high", e.target.value)}
                disabled={saving} />
              <div className={styles.priceUnit}>credits</div>
            </div>
          </div>
        </div>

        <div className={styles.modelBlock}>
          <div className={styles.modelLabel}>Image → Image</div>
          <div className={styles.row}>
            <div className={styles.priceCard}>
              <div className={styles.priceLabel}>Normal Quality</div>
              <div className={styles.priceDesc}>2K resolution</div>
              <input type="number" min={1} className={styles.priceInput}
                value={imagePricing.i2i_normal ?? 3}
                onChange={(e) => setImageCredit("i2i_normal", e.target.value)}
                disabled={saving} />
              <div className={styles.priceUnit}>credits</div>
            </div>
            <div className={styles.priceCard}>
              <div className={styles.priceLabel}>High Quality</div>
              <div className={styles.priceDesc}>4K resolution</div>
              <input type="number" min={1} className={styles.priceInput}
                value={imagePricing.i2i_high ?? 6}
                onChange={(e) => setImageCredit("i2i_high", e.target.value)}
                disabled={saving} />
              <div className={styles.priceUnit}>credits</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Video Generation</div>
        <div className={styles.sectionSub}>Credits charged per video — Audio doubles the cost</div>

        {VIDEO_MODELS.map(({ key, label }) => (
          <div key={key} className={styles.modelBlock}>
            <div className={styles.modelLabel}>{label}</div>
            <div className={styles.durationRow}>
              {VIDEO_DURATIONS.map((sec) => (
                <div key={sec} className={styles.durationCard}>
                  <div className={styles.durationSec}>{sec === 60 ? "1 min" : `${sec}s`}</div>
                  <input type="number" min={1} className={styles.priceInput}
                    value={videoPricing[key]?.[sec] ?? ""}
                    placeholder="—"
                    onChange={(e) => setVideoCredit(key, sec, e.target.value)}
                    disabled={saving} />
                  <div className={styles.priceUnit}>credits</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}