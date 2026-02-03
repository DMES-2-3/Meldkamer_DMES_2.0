import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../login.css";

function Register() {
  const navigate = useNavigate();
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
      const res = await fetch(
        "http://localhost:8080/src/api/v1/user/register",
        {
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
        setMsg(data.message || "Registration successful!");
        setTimeout(() => navigate("/login"), 1000);
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
        <h1>Register</h1>
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
          <label>First Name</label>
          <input
            autoFocus
            type="text"
            name="firstname"
            value={form.firstname}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Last Name</label>
          <input
            type="text"
            name="lastname"
            value={form.lastname}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleInputChange}
            disabled={loading}
          />
          <label>Birthday</label>
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
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="clickable" onClick={() => navigate("/")}>
          Already have an account? Login here.
        </p>
      </div>
    </div>
  );
}

export default Register;
