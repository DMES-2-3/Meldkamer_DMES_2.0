import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../login.css";
import logo from "../assets/logo/DMES_Vierkant_Logo.png";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", pass: "" });
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/src/api/v1/user/session",
          { credentials: "include" },
        );
        const data = await res.json();
        if (data.success) navigate("/evenementen");
      } catch {}
    };
    checkSession();
  }, [navigate]);

  const handleInputChange = (e) => {
    setErrors([]);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loginSubmit = async () => {
    setLoading(true);
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
        setTimeout(() => navigate("/evenementen"), 500);
      }
    } catch (err) {
      setErrors([`Network error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

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
            disabled={loading}
          />
          <label>Password</label>
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
            Show password
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="clickable" onClick={() => navigate("/register")}>
          Don't have an account? Register here.
        </p>
      </div>
    </div>
  );
}

export default Login;
