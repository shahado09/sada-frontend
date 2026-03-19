import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function GoogleSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loadMe } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login?error=google_failed");
      return;
    }
    localStorage.setItem("accessToken", token);
    loadMe().then(() => navigate("/dashboard")).catch(() => navigate("/login"));
  }, []);

  return <div style={{ padding: 40, textAlign: "center" }}>Logging you in...</div>;
}