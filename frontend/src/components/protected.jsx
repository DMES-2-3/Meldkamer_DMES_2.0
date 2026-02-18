import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ Component }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/src/api/v1/user/session",
          { credentials: "include" },
        );
        const data = await res.json();
        setAllowed(data.success === true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  if (loading) return <p>Sessie checken...</p>;

  if (!allowed) return <Navigate to="/login" replace />;

  // If Component prop is provided, render it; otherwise use Outlet for nested routes
  return Component ? <Component /> : <Outlet />;
}
