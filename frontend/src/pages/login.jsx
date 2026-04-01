import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../login.css";
import logo from "../assets/logo/DMES_Vierkant_Logo.png";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";
import { getCsrfToken, clearCsrfToken } from "../config/csrf";

function Login() {
  const navigate = useNavigate();
  const { user, loading, refreshSession } = useAuth();
  const [form, setForm] = useState({ email: "", pass: "" });
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/evenementen", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e) => {
    setErrors([]);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loginSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    setMsg("");

    try {
      clearCsrfToken();
      const csrfToken = await getCsrfToken();

      const res = await fetch(apiUrl("src/api/v1/user/login"), {
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
        setMsg(data.message || "Login successful!");
        clearCsrfToken();
        await refreshSession();
        navigate("/evenementen", { replace: true });
      }
    } catch (err) {
      setErrors([`Network error: ${err.message}`]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="login-page">
      <div className="form">
        <img className="login-logo" src={logo} alt="DMES_logo" />
        <h1>Login</h1>

        {errors.map((e, i) => (
          <p key={i} className="error">
            {e}
          </p>
        ))}

        {msg && <p className="success">{msg}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginSubmit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              loginSubmit();
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
            disabled={submitting}
          />

          <label>Wachtwoord</label>
          <input
            type={showPass ? "text" : "password"}
            name="pass"
            value={form.pass}
            onChange={handleInputChange}
            disabled={submitting}
          />

          <label className="show-pass">
            <input
              type="checkbox"
              checked={showPass}
              onChange={() => setShowPass(!showPass)}
              disabled={submitting}
            />
            Toon wachtwoord
          </label>

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Inloggen..." : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;