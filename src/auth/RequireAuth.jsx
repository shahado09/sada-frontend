import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}