import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../login.css";
import logo from "../assets/logo/DMES_Vierkant_Logo.png";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { user, loading, refreshSession } = useAuth();
  const [form, setForm] = useState({ email: "", pass: "" });
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // If already logged in, skip straight to the app
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
      const res = await fetch("http://localhost:8080/src/api/v1/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors([
          data.error || `Server error: ${res.status} ${res.statusText}`,
        ]);
      } else {
        setMsg(data.message || "Login successful!");
        // Refresh the shared auth context so the rest of the app knows who is logged in
        await refreshSession();
        navigate("/evenementen", { replace: true });
      }
    } catch (err) {
      setErrors([`Network error: ${err.message}`]);
    } finally {
      setSubmitting(false);
    }
  };

  // While we're still checking the existing session, show nothing to avoid flicker
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
