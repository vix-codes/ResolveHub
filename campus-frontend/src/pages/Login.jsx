
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import API from "../services/api";
import AppBrand from "../components/AppBrand";
import { getDemoLoginResponse } from "../services/api";

const Login = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isDemo = import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.VITE_DEMO_MODE === true;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      if (response.status === 200 && response.data.token) {
        login(response.data);
      } else {
        setError(
          response.data.message || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      if (!localStorage.getItem("demo_role")) {
        localStorage.setItem("demo_role", "admin");
      }
      login(getDemoLoginResponse());
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-card card glass-card">
        <div style={{ marginBottom: "10px" }}>
          <AppBrand size="lg" label="ResolveHub" />
        </div>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            {isDemo && (
              <button 
                type="button" 
                className="button button--ghost" 
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Try Demo (No Backend)
              </button>
            )}
          </div>
        </form>
        {error && (
          <div style={{ color: "red", marginTop: "10px" }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
