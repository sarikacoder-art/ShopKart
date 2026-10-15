import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password || !form.phone) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    try {
      await api.post("/customers/register", form);
      navigate("/login", { state: { message: "Registration successful. Please login." } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="page">
      <div className="form-box">
        <h1>ShopKart</h1>
        <h2>Register</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} />
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} />
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} />
          <label>Phone Number</label>
          <input name="phone" value={form.phone} onChange={handleChange} />
          <button type="submit">Create Account</button>
        </form>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register;
