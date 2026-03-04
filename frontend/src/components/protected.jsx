import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Protected({ Component, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Sessie checken...</p>;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !user.isAdmin) return <Navigate to="/evenementen" replace />;

  return <Component />;
}
