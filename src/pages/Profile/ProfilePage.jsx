import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/api";
import styles from "./ProfilePage.module.css";

function formatDate(d, lang) {
  return new Date(d).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const REASON_ICON = {
  pack_purchase: "💳",
  subscription_grant: "⭐",
  generation_spend: "🎨",
  refund: "↩️",
  manual_adjustment: "🔧",
};

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [profile, setProfile]   = useState(null);
  const [ledger, setLedger]     = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [newEmail, setNewEmail]   = useState("");
  const [emailMsg, setEmailMsg]   = useState({ text: "", ok: false });
  const [emailBusy, setEmailBusy] = useState(false);

  const [curPass, setCurPass]         = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg]         = useState({ text: "", ok: false });
  const [passBusy, setPassBusy]       = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/profile"),
      api.get("/ledger/me?limit=20"),
      api.get("/payments/my").catch(() => ({ data: [] })),
    ]).then(([profRes, ledgerRes, payRes]) => {
      setProfile(profRes.data.user);
      setLedger(ledgerRes.data.entries || []);
      setPayments(Array.isArray(payRes.data) ? payRes.data : (payRes.data?.items || []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleEmailSave() {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setEmailMsg({ text: "Enter a valid email", ok: false }); return;
    }
    setEmailBusy(true); setEmailMsg({ text: "", ok: false });
    try {
      const res = await api.patch("/profile/email", { email: newEmail.trim() });
      setProfile((p) => ({ ...p, email: res.data.user.email }));
      setNewEmail("");
      setEmailMsg({ text: "Email updated ✓", ok: true });
    } catch (e) {
      setEmailMsg({ text: e?.response?.data?.message || "Failed", ok: false });
    } finally { setEmailBusy(false); }
  }

  async function handlePasswordSave() {
    if (!curPass || !newPass || !confirmPass) {
      setPassMsg({ text: "Fill all fields", ok: false }); return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ text: "Passwords don't match", ok: false }); return;
    }
    if (newPass.length < 8) {
      setPassMsg({ text: t("profile.minChars"), ok: false }); return;
    }
    setPassBusy(true); setPassMsg({ text: "", ok: false });
    try {
      await api.patch("/profile/password", { currentPassword: curPass, newPassword: newPass });
      setCurPass(""); setNewPass(""); setConfirmPass("");
      setPassMsg({ text: "Password updated ✓", ok: true });
    } catch (e) {
      setPassMsg({ text: e?.response?.data?.message || "Failed", ok: false });
    } finally { setPassBusy(false); }
  }

  const email      = profile?.email || authUser?.email || "";
  const credits    = profile?.credits ?? authUser?.credits ?? 0;
  const initials   = email[0]?.toUpperCase() || "U";
  const joinedDate = profile?.createdAt ? formatDate(profile.createdAt, lang) : null;

  if (loading) {
    return <div className={styles.loadWrap}><div className={styles.spinner} /></div>;
  }

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.heroCard}>
        <div className={styles.avatarRing}>
          <div className={styles.avatar}>{initials}</div>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.heroEmail}>{email}</div>
          <div className={styles.heroBadgeRow}>
            <span className={styles.heroBadge}>
              {profile?.role === "admin" ? t("profile.admin") : t("profile.member")}
            </span>
            {joinedDate && (
              <span className={styles.heroJoined}>{t("profile.joined", { date: joinedDate })}</span>
            )}
          </div>
        </div>
        <div className={styles.creditsBox}>
          <div className={styles.creditsNum}>{credits}</div>
          <div className={styles.creditsLabel}>{t("profile.credits")}</div>
        </div>
      </div>

      {/* Credit History */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          {t("profile.creditHistory")}
          <span className={styles.cardCount}>{ledger.length}</span>
        </div>
        <div className={styles.cardBody}>
          {ledger.length === 0 ? (
            <div className={styles.empty}>{t("profile.noTransactions")}</div>
          ) : (
            <div className={styles.ledgerList}>
              {ledger.map((entry) => (
                <div key={entry._id} className={styles.ledgerRow}>
                  <div className={styles.ledgerIcon}>{REASON_ICON[entry.reason] || "•"}</div>
                  <div className={styles.ledgerInfo}>
                    <div className={styles.ledgerReason}>
                      {t(`profile.reasons.${entry.reason}`, { defaultValue: entry.reason })}
                    </div>
                    <div className={styles.ledgerDate}>{formatDate(entry.createdAt, lang)}</div>
                  </div>
                  <div className={`${styles.ledgerPoints} ${entry.type === "credit" ? styles.creditPts : styles.debitPts}`}>
                    {entry.type === "credit" ? "+" : "−"}{entry.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          {t("profile.paymentHistory")}
          <span className={styles.cardCount}>{payments.length}</span>
        </div>
        <div className={styles.cardBody}>
          {payments.length === 0 ? (
            <div className={styles.empty}>{t("profile.noPayments")}</div>
          ) : (
            <div className={styles.paymentList}>
              {payments.map((p) => (
                <div key={p._id} className={styles.paymentRow}>
                  <div className={styles.paymentInfo}>
                    <div className={styles.paymentItem}>{p.itemCode}</div>
                    <div className={styles.paymentDate}>{formatDate(p.createdAt, lang)}</div>
                  </div>
                  <div className={styles.paymentMeta}>
                    <span className={`${styles.paymentStatus} ${styles[`status_${p.status}`]}`}>
                      {t(`profile.statuses.${p.status}`, { defaultValue: p.status })}
                    </span>
                    {p.amountBHD && (
                      <span className={styles.paymentAmount}>{p.amountBHD} BD</span>
                    )}
                  </div>
                  {p.status === "rejected" && p.rejectionReason && (
                    <div className={styles.paymentReason}>
                      {t("profile.reason")} {p.rejectionReason}
                    </div>
                  )}
                  {p.status === "rejected" && (
                    <button className={styles.resubmitBtn}
                      onClick={() => navigate(`/payment/${p._id}`)}>
                      {t("profile.resubmit")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Change Email */}
      <div className={styles.card}>
        <div className={styles.cardHead}>{t("profile.changeEmail")}</div>
        <div className={styles.cardForm}>
        <div className={styles.formRow}>
          <label className={styles.label}>{t("profile.current")}</label>
          <div className={styles.readOnly}>{email}</div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>{t("profile.newEmail")}</label>
          <input className={styles.input} type="email" placeholder="new@email.com"
            value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSave()} />
        </div>
        {emailMsg.text && <div className={emailMsg.ok ? styles.ok : styles.err}>{emailMsg.text}</div>}
        <button className={styles.btn} onClick={handleEmailSave} disabled={emailBusy}>
          {emailBusy ? t("profile.saving") : t("profile.saveEmail")}
        </button>
        </div>
      </div>

      {/* Change Password */}
      <div className={styles.card}>
        <div className={styles.cardHead}>{t("profile.changePassword")}</div>
        <div className={styles.cardForm}>
        <div className={styles.formRow}>
          <label className={styles.label}>{t("profile.currentPassword")}</label>
          <input className={styles.input} type="password" placeholder="••••••••"
            value={curPass} onChange={(e) => setCurPass(e.target.value)} />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>{t("profile.newPassword")}</label>
          <input className={styles.input} type="password" placeholder={t("profile.minChars")}
            value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>{t("profile.confirmPassword")}</label>
          <input className={styles.input} type="password" placeholder={t("profile.repeatPassword")}
            value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
        </div>
        {passMsg.text && <div className={passMsg.ok ? styles.ok : styles.err}>{passMsg.text}</div>}
        <button className={styles.btn} onClick={handlePasswordSave} disabled={passBusy}>
          {passBusy ? t("profile.saving") : t("profile.savePassword")}
        </button>
        </div>
      </div>

    </div>
  );
}