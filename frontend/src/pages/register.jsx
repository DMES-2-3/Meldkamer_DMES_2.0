import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import "../login.css";
import { useAuth } from "../contexts/AuthContext";
import { getCsrfToken } from "../config/csrf";

function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshSession } = useAuth();

  const [form, setForm] = useState({
    email: "",
    pass: "",
  });

  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate("/evenementen", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (e) => {
    setErrors([]);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registerSubmit = async () => {
    setLoading(true);
    setErrors([]);
    setMsg("");

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch(apiUrl("src/api/v1/user/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Server gaf geen geldige JSON response terug.");
      }

      const data = await res.json();

      if (!res.ok) {
        setErrors([
          data.error || `Server error: ${res.status} ${res.statusText}`,
        ]);
      } else {
        setMsg(data.message || "Registratie geslaagd!");
        await refreshSession();
        setTimeout(() => navigate("/evenementen"), 1000);
      }
    } catch (err) {
      setErrors([`Network error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || !user.isAdmin) return null;

  return (
    <div className="login-page">
      <div className="form">
        <h1>Registreer Gebruiker</h1>

        {errors.map((e, i) => (
          <p key={i} className="error">
            {e}
          </p>
        ))}

        {msg && <p className="success">{msg}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerSubmit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              registerSubmit();
            }
          }}
        >
          <label>Email</label>
          <input
            autoFocus
            type="email"
            name="email"
            value={form.email}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label>Wachtwoord</label>
          <input
            type={showPass ? "text" : "password"}
            name="pass"
            value={form.pass}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label className="show-pass">
            <input
              type="checkbox"
              checked={showPass}
              onChange={() => setShowPass(!showPass)}
              disabled={loading}
            />
            Toon wachtwoord
          </label>

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Registreren..." : "Registreren"}
          </button>
        </form>

        <p className="clickable" onClick={() => navigate("/evenementen")}>
          Terug naar evenementen
        </p>
      </div>
    </div>
  );
}

export default Register;