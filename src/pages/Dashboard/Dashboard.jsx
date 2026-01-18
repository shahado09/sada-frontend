import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Welcome to Sada AI 👋</h2>
      <p>User: {user ? `${user.id} (${user.role})` : "..."}</p>

      <button onClick={handleLogout} style={{ marginTop: 16 }}>
        Logout
      </button>
    </div>
  );
}



