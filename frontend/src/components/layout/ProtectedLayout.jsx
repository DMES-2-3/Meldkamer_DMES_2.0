import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import TopNav from "./TopNav";

export default function ProtectedLayout() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/src/api/v1/index.php/user/session",
          { credentials: "include" }
        );
        const data = await res.json();
        setAllowed(data.success === true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) return <p>Checking session…</p>;

  if (!allowed) return <Navigate to="/" replace />;

  return (
    <>
      <TopNav />
      <Outlet />
    </>
  );
}
