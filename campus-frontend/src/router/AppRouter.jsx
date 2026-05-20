
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import TenantDashboard from "../pages/TenantDashboard";
import TechnicianDashboard from "../pages/TechnicianDashboard";

const normalizeBasename = (value) => {
  const raw = String(value || "").trim();
  if (!raw || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
};

const routerBasename = normalizeBasename(import.meta.env.BASE_URL);

// A component to protect routes that require authentication
const PrivateRoute = ({ children, requiredRoles }) => {
  const { token, role } = useAuth(); // Correctly use token and role

  if (!token) {
    // If there is no token, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    // If a role is required and the user's role does not match, redirect to home.
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { token, role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case "admin":
        return "/admin-dashboard";
      case "manager":
        return "/admin-dashboard";
      case "tenant":
        return "/tenant-dashboard";
      case "technician":
        return "/technician-dashboard";
      default:
        return "/"; // Fallback
    }
  };

  return (
    <Router basename={routerBasename}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />

        {/* If logged in, redirect from login/register to the dashboard */}
        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to={getDashboardPath()} replace />}
        />
        <Route
          path="/register"
          element={!token ? <Register /> : <Navigate to={getDashboardPath()} replace />}
        />

        {/* Private routes with dashboard layouts */}
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute requiredRoles={["admin", "manager"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant-dashboard"
          element={
            <PrivateRoute requiredRoles={["tenant"]}>
              <TenantDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/technician-dashboard"
          element={
            <PrivateRoute requiredRoles={["technician"]}>
              <TechnicianDashboard />
            </PrivateRoute>
          }
        />

        {/* A catch-all route to redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
