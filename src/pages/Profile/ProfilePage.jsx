import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/api";
import styles from "./ProfilePage.module.css";

const REASON_LABEL = {
  pack_purchase: "Credit Pack",
  subscription_grant: "Subscription",
  generation_spend: "Generation",
  refund: "Refund",
  manual_adjustment: "Adjustment",
};

const REASON_ICON = {
  pack_purchase: "💳",
  subscription_grant: "⭐",
  generation_spend: "🎨",
  refund: "↩️",
  manual_adjustment: "🔧",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile, setProfile]   = useState(null);
  const [ledger, setLedger]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState({ text: "", ok: false });
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
    ]).then(([profRes, ledgerRes]) => {
      setProfile(profRes.data.user);
      setLedger(ledgerRes.data.entries || []);
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
      setPassMsg({ text: "Min 8 characters", ok: false }); return;
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
  const joinedDate = profile?.createdAt ? formatDate(profile.createdAt) : null;

  if (loading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
      </div>
    );
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
              {profile?.role === "admin" ? "Admin" : "Member"}
            </span>
            {joinedDate && (
              <span className={styles.heroJoined}>Joined {joinedDate}</span>
            )}
          </div>
        </div>
        <div className={styles.creditsBox}>
          <div className={styles.creditsNum}>{credits}</div>
          <div className={styles.creditsLabel}>Credits</div>
        </div>
      </div>

      {/* Credit History */}
      <div className={styles.card}>
        <div className={styles.cardHead}>Credit History</div>
        {ledger.length === 0 ? (
          <div className={styles.empty}>No transactions yet</div>
        ) : (
          <div className={styles.ledgerList}>
            {ledger.map((entry) => (
              <div key={entry._id} className={styles.ledgerRow}>
                <div className={styles.ledgerIcon}>
                  {REASON_ICON[entry.reason] || "•"}
                </div>
                <div className={styles.ledgerInfo}>
                  <div className={styles.ledgerReason}>
                    {REASON_LABEL[entry.reason] || entry.reason}
                  </div>
                  <div className={styles.ledgerDate}>{formatDate(entry.createdAt)}</div>
                </div>
                <div className={`${styles.ledgerPoints} ${entry.type === "credit" ? styles.creditPts : styles.debitPts}`}>
                  {entry.type === "credit" ? "+" : "−"}{entry.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Email */}
      <div className={styles.card}>
        <div className={styles.cardHead}>Change Email</div>
        <div className={styles.formRow}>
          <label className={styles.label}>Current</label>
          <div className={styles.readOnly}>{email}</div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>New email</label>
          <input
            className={styles.input}
            type="email"
            placeholder="new@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSave()}
          />
        </div>
        {emailMsg.text && (
          <div className={emailMsg.ok ? styles.ok : styles.err}>{emailMsg.text}</div>
        )}
        <button className={styles.btn} onClick={handleEmailSave} disabled={emailBusy}>
          {emailBusy ? "Saving…" : "Save Email"}
        </button>
      </div>

      {/* Change Password */}
      <div className={styles.card}>
        <div className={styles.cardHead}>Change Password</div>
        <div className={styles.formRow}>
          <label className={styles.label}>Current password</label>
          <input className={styles.input} type="password" placeholder="••••••••"
            value={curPass} onChange={(e) => setCurPass(e.target.value)} />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>New password</label>
          <input className={styles.input} type="password" placeholder="Min 8 characters"
            value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>Confirm</label>
          <input className={styles.input} type="password" placeholder="Repeat new password"
            value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
        </div>
        {passMsg.text && (
          <div className={passMsg.ok ? styles.ok : styles.err}>{passMsg.text}</div>
        )}
        <button className={styles.btn} onClick={handlePasswordSave} disabled={passBusy}>
          {passBusy ? "Saving…" : "Save Password"}
        </button>
      </div>

    </div>
  );
}
