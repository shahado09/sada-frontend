import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/api";
import styles from "./VerifyEmailPage.module.css";

export default function VerifyEmailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const email = state?.email || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const refs = useRef([]);

  useEffect(() => { if (!email) navigate("/signup"); }, [email]);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function fmtTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function handleChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d !== "")) submitCode(next.join(""));
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      submitCode(text);
    }
  }

  async function submitCode(code) {
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/verify-email", { email, code });
      authLogin(res.data.accessToken, res.data.user);
      navigate("/dashboard");
    } catch (e) {
      setError(e?.response?.data?.message || "Invalid code");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  }

  async function resendCode() {
    setResending(true); setError(""); setResent(false);
    try {
      await api.post("/auth/resend-code", { email });
      setResent(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to resend");
    } finally { setResending(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>SADA</div>
        <div className={styles.brandSub}>VISUAL CONTENT STUDIO</div>

        <div className={styles.icon}>✉️</div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.sub}>
          We sent a 6-digit code to<br />
          <strong>{email}</strong>
        </p>

        <div className={styles.codeRow} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              className={`${styles.digitInput} ${d ? styles.digitFilled : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
            />
          ))}
        </div>

        {loading && <div className={styles.loadingBar} />}
        {error && <div className={styles.error}>{error}</div>}
        {resent && <div className={styles.success}>Code resent ✓</div>}

        <div className={`${styles.countdown} ${countdown === 0 ? styles.countdownExpired : ""}`}>
          {countdown > 0 ? `Code expires in ${fmtTime(countdown)}` : "Code expired — request a new one"}
        </div>

        <button className={styles.resendBtn} onClick={() => { resendCode(); setCountdown(300); }} disabled={resending || countdown > 240}>
          {resending ? "Sending..." : "Didn't receive it? Resend"}
        </button>

        <button className={styles.backBtn} onClick={() => navigate("/signup")}>
          ← Back to signup
        </button>
      </div>
    </div>
  );
}