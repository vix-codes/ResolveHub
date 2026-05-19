
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "../components/NotificationBell";
import AppBrand from "../components/AppBrand";

const DashboardLayout = ({ children }) => {
  const { logout } = useAuth();

  return (
    <>
      <div className="topbar">
        <div className="topbar__brand">
          <AppBrand size="md" label="ResolveHub" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NotificationBell />
          <button
            onClick={logout}
            className="button button--ghost button--small"
          >
            Logout
          </button>
        </div>
      </div>
      {children}
    </>
  );
};

export default DashboardLayout;
