import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // step: "email" | "otp" | "done"
  const [step, setStep] = useState("email");

  const [email, setEmail]         = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErr, setEmailErr]   = useState("");

  const [digits, setDigits]       = useState(["", "", "", "", "", ""]);
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpErr, setOtpErr]       = useState("");
  const [countdown, setCountdown] = useState(300);
  const refs = useRef([]);

  useEffect(() => {
    if (step !== "otp") return;
    refs.current[0]?.focus();
    const interval = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  function fmtTime(s) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setEmailErr("Enter a valid email"); return; }
    setEmailLoading(true); setEmailErr("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep("otp");
      setCountdown(300);
    } catch (err) {
      setEmailErr(err?.response?.data?.message || "Something went wrong");
    } finally { setEmailLoading(false); }
  }

  function handleDigitChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  function handleDigitKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) setDigits(text.split(""));
  }

  async function handleReset(e) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setOtpErr("Enter the 6-digit code"); return; }
    if (!newPass || newPass.length < 8) { setOtpErr("Password must be at least 8 characters"); return; }
    if (newPass !== confirmPass) { setOtpErr("Passwords don't match"); return; }
    setOtpLoading(true); setOtpErr("");
    try {
      await api.post("/auth/reset-password", { email, code, newPassword: newPass });
      setStep("done");
    } catch (err) {
      setOtpErr(err?.response?.data?.message || "Invalid or expired code");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally { setOtpLoading(false); }
  }

  async function resendCode() {
    try {
      await api.post("/auth/forgot-password", { email });
      setCountdown(300);
      setDigits(["", "", "", "", "", ""]);
    } catch {}
  }

  // ── Step: Email ──
  if (step === "email") return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>SADA</div>
        <div className={styles.brandSub}>VISUAL CONTENT STUDIO</div>
        <div className={styles.icon}>🔑</div>
        <h1 className={styles.title}>Forgot password?</h1>
        <p className={styles.sub}>Enter your email and we'll send you a reset code.</p>

        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          {emailErr && <div className={styles.error}>{emailErr}</div>}
          <button className={styles.btn} type="submit" disabled={emailLoading}>
            {emailLoading ? "Sending..." : "Send reset code"}
          </button>
        </form>

        <Link to="/login" className={styles.backBtn}>← Back to login</Link>
      </div>
    </div>
  );

  // ── Step: OTP + New Password ──
  if (step === "otp") return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>SADA</div>
        <div className={styles.brandSub}>VISUAL CONTENT STUDIO</div>
        <div className={styles.icon}>✉️</div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.sub}>We sent a 6-digit code to<br /><strong>{email}</strong></p>

        <form onSubmit={handleReset} className={styles.form}>
          {/* OTP digits */}
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
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleDigitKeyDown(i, e)}
                disabled={otpLoading}
              />
            ))}
          </div>

          {/* New password */}
          <div className={styles.passWrap}>
            <input
              className={styles.input}
              type={showPass ? "text" : "password"}
              placeholder="New password (min 8 chars)"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <input
            className={styles.input}
            type="password"
            placeholder="Confirm new password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
          />

          {otpErr && <div className={styles.error}>{otpErr}</div>}

          <div className={`${styles.countdown} ${countdown === 0 ? styles.countdownExpired : ""}`}>
            {countdown > 0 ? `Code expires in ${fmtTime(countdown)}` : "Code expired — request a new one"}
          </div>

          <button className={styles.btn} type="submit" disabled={otpLoading}>
            {otpLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <button className={styles.resendBtn} onClick={resendCode} disabled={countdown > 240}>
          Didn't receive it? Resend
        </button>
        <button className={styles.backBtn} onClick={() => setStep("email")}>← Back</button>
      </div>
    </div>
  );

  // ── Step: Done ──
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>SADA</div>
        <div className={styles.brandSub}>VISUAL CONTENT STUDIO</div>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Password reset!</h1>
        <p className={styles.sub}>Your password has been updated successfully.</p>
        <button className={styles.btn} onClick={() => navigate("/login")}>
          Go to login
        </button>
      </div>
    </div>
  );
}