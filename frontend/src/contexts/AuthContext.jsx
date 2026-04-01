import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiUrl } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("src/api/v1/user/session"), {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setUser({ userId: data.user_id, isAdmin: data.is_admin });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const clearUser = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, refreshSession, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}