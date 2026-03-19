import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function GoogleSuccessPage() {
  const [params] = useSearchParams();
  const { saveToken, loadMe } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      window.location.href = "/login?error=google_failed";
      return;
    }

    saveToken(token);
    loadMe().finally(() => {
      window.location.href = "/dashboard";
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "var(--bg)",
      color: "var(--text)"
    }}>
      <p>Logging you in...</p>
    </div>
  );
}