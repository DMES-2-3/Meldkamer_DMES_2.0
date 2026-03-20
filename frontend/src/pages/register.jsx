import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import "../login.css";
import { useAuth } from "../contexts/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    birthday: "",
    email: "",
    pass: "",
  });
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleInputChange = (e) => {
    setErrors([]);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const registerSubmit = async () => {
    setLoading(true);
    setErrors([]);
    setMsg("");

    try {
      const res = await fetch(`${apiUrl("src/api/v1/user/register")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        },
      );

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
        >
          <label>Voornaam</label>
          <input
            autoFocus
            type="text"
            name="firstname"
            value={form.firstname}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Achternaam</label>
          <input
            type="text"
            name="lastname"
            value={form.lastname}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Gebruikersnaam</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Geboortedatum</label>
          <input
            type="date"
            name="birthday"
            value={form.birthday}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Email</label>
          <input
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
