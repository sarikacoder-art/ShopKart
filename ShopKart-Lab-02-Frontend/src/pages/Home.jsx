import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Home() {
  const [customer, setCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/customers/me")
      .then((response) => setCustomer(response.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  if (!customer) return <p className="loading">Loading...</p>;

  return (
    <div>
      <Navbar />
      <div className="home-box">
        <h1>Welcome, {customer.fullName}</h1>
        <h2>Your Profile</h2>
        <p><b>Name:</b> {customer.fullName}</p>
        <p><b>Email:</b> {customer.email}</p>
        <p><b>Phone:</b> {customer.phone}</p>
        <button onClick={() => navigate("/products")}>Browse Products</button>
      </div>
    </div>
  );
}

export default Home;
