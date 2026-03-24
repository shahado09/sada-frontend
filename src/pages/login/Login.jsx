import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import { useAuth } from "../../auth/AuthContext";

const BACKEND = "https://api.sadavisualstudio.com";
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setIsError(false);
    setLoading(true);
    try {
      await login({ email, password });
      setMsg("Logged in!");
      setIsError(false);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "Login failed");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>Login</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div className={styles.passwordWrap}>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
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


          <div style={{ textAlign: "right", marginTop: -4 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "underline" }}>
              Forgot password?
            </Link>
          </div>

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>

        <a href={`${BACKEND}/api/auth/google`} className={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.4 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 13 5 4 14 4 24s9 19 20 19c11 0 19-8 19-19 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5c-7.7 0-14.3 4.4-17.7 9.7z"/>
            <path fill="#4CAF50" d="M24 43c5 0 9.5-1.9 12.9-5l-6-4.9C29.2 34.6 26.7 35 24 35c-5.1 0-9.5-2.6-11.3-6.5l-6.5 5C9.7 38.6 16.4 43 24 43z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.6 4.4-4.8 5.7l6 4.9C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </a>

        {msg && (
          <p className={`${styles.msg} ${isError ? styles.error : styles.success}`}>
            {msg}
          </p>
        )}

        <p style={{ marginTop: 12, fontSize: 14 }}>
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}