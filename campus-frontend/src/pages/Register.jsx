import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../services/api";
import AppBrand from "../components/AppBrand";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
      });
      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to register right now.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div style={{ marginBottom: "10px" }}>
          <AppBrand size="lg" label="ResolveHub" />
        </div>
        <h1>Register</h1>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {error && (
          <div style={{ color: "red", marginTop: "10px" }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
