import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      await api.post("/customers/login", { email, password });
      navigate("/home");
    } catch (err) {
      setError(err.response?.status === 401 ? "Invalid Credentials" : "Login failed");
    }
  }

  return (
    <div className="page">
      <div className="form-box">
        <h1>ShopKart</h1>
        <h2>Login</h2>
        {location.state?.message && <p className="success">{location.state.message}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit">Login</button>
        </form>
        <p>New user? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}

export default Login;
