import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import API from "../services/api";
import useFetch from "../hooks/useFetch";
import ActivityFeed from "../components/ActivityFeed";
import Analytics from "../components/Analytics";
import ComplaintCard from "../components/ComplaintCard";
import CreateUserForm from "../components/CreateUserForm";
import DashboardShell from "../components/DashboardShell";
import NoticeBanner from "../components/NoticeBanner";
import IconButton from "../components/IconButton";
import {
  ActivityIcon,
  ChartIcon,
  DashboardIcon,
  FileIcon,
  RefreshIcon,
  UserPlusIcon,
} from "../components/icons";

const sections = {
  DASHBOARD: "dashboard",
  COMPLAINTS: "complaints",
  ANALYTICS: "analytics",
  USERS: "users",
  ACTIVITY: "activity",
};

function AdminDashboard() {
  const { role, userName } = useAuth();
  const [notice, setNotice] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState(sections.DASHBOARD);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: complaints, loading: complaintsLoading, refetch: fetchComplaints } = useFetch("/complaints");
  const { data: dashboardComplaints, loading: dashboardLoading, refetch: fetchDashboardComplaints } = useFetch(
    "/complaints?includeClosed=false&limit=10"
  );
  const { data: technicians, refetch: fetchTechnicians } = useFetch("/auth/technicians");
  const { data: analytics, loading: analyticsLoading, refetch: fetchAnalytics } = useFetch("/admin/analytics");
  const { data: aiAnalytics, refetch: fetchAiAnalytics } = useFetch("/admin/analytics/ai");

  const refreshAllComplaints = () => {
    fetchComplaints();
    fetchDashboardComplaints();
  };

  const handleApiCall = async (apiCall, successMessage, errorMessage) => {
    try {
      await apiCall();
      setNotice({ tone: "success", message: successMessage });
      refreshAllComplaints();
      fetchAnalytics();
      fetchAiAnalytics();
    } catch (err) {
      setNotice({
        tone: "error",
        message: err.response?.data?.message || errorMessage,
      });
    }
  };

  const assignComplaint = (id, technicianId) => {
    if (!technicianId) {
      setNotice({ tone: "error", message: "Select a technician to assign." });
      return;
    }
    handleApiCall(
      () => API.put(`/complaints/assign/${id}`, { technicianId }),
      "Complaint assigned successfully.",
      "Unable to assign complaint."
    );
  };

  const deleteComplaint = (id) => {
    handleApiCall(() => API.delete(`/complaints/${id}`), "Complaint deleted.", "Unable to delete complaint.");
  };

  const closeComplaint = (id) => {
    handleApiCall(
      () => API.put(`/complaints/status/${id}`, { status: "CLOSED" }),
      "Complaint closed.",
      "Unable to close complaint."
    );
  };

  const reopenComplaint = (id) => {
    handleApiCall(
      () => API.put(`/complaints/status/${id}`, { status: "NEW" }),
      "Complaint reopened.",
      "Unable to reopen complaint."
    );
  };

  const updatePriority = (id, priority) => {
    if (!priority) return;
    handleApiCall(
      () => API.put(`/complaints/priority/${id}`, { priority }),
      "Priority updated.",
      "Unable to update priority."
    );
  };

  const latestUnclosed = dashboardComplaints || [];

  const filteredComplaints = useMemo(() => {
    const allComplaints = complaints || [];
    if (!searchTerm.trim()) return allComplaints;
    const needle = searchTerm.trim().toLowerCase();
    return allComplaints.filter((complaint) => {
      const joined = [
        complaint.title,
        complaint.description,
        complaint.token,
        complaint.status,
        complaint.priority,
        complaint.createdBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return joined.includes(needle);
    });
  }, [complaints, searchTerm]);

  const navItems = [
    { key: sections.DASHBOARD, label: "Dashboard", icon: DashboardIcon },
    { key: sections.COMPLAINTS, label: "All Complaints", icon: FileIcon },
    { key: sections.ANALYTICS, label: "Analytics", icon: ChartIcon, expandOnly: true },
    { key: sections.USERS, label: "Create User", icon: UserPlusIcon, expandOnly: role === "admin" },
    { key: sections.ACTIVITY, label: "Activity", icon: ActivityIcon, expandOnly: true },
  ].filter((item) => !(item.key === sections.USERS && role !== "admin"));

  const handleToggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      if (!next) {
        const restricted = [sections.ANALYTICS, sections.USERS, sections.ACTIVITY];
        if (restricted.includes(activeSection)) {
          setActiveSection(sections.DASHBOARD);
        }
      }
      return next;
    });
  };

  const renderComplaintGrid = (list) => (
    <div className="grid">
      {list.map((complaint) => (
        <ComplaintCard
          key={complaint._id}
          complaint={complaint}
          technicians={technicians || []}
          onAssign={assignComplaint}
          onPriorityChange={updatePriority}
          onClose={closeComplaint}
          onReopen={reopenComplaint}
          onDelete={role === "admin" ? deleteComplaint : undefined}
        />
      ))}
    </div>
  );

  return (
    <DashboardShell
      greeting={`Welcome, ${userName || (role === "manager" ? "Manager" : "Admin")}`}
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={handleToggleSidebar}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <NoticeBanner message={notice?.message} tone={notice?.tone} onClose={() => setNotice(null)} />

      {activeSection === sections.DASHBOARD && (
        <section className="section section--first">
          <div className="section__header">
            <div>
              <h3>Latest Unclosed Complaints</h3>
              <p className="muted">Most recent requests that are not closed.</p>
            </div>
            <IconButton
              onClick={fetchDashboardComplaints}
              disabled={dashboardLoading}
              title={dashboardLoading ? "Refreshing..." : "Refresh dashboard"}
            >
              <RefreshIcon className={dashboardLoading ? "spin" : ""} />
            </IconButton>
          </div>

          {latestUnclosed.length === 0 && <p className="muted">No unclosed complaints.</p>}
          {renderComplaintGrid(latestUnclosed)}
        </section>
      )}

      {activeSection === sections.COMPLAINTS && (
        <section className="section section--first">
          <div className="section__header">
            <div>
              <h3>All Complaints</h3>
              <p className="muted">Manage assignments, priority, status, and deletion.</p>
            </div>
            <IconButton
              onClick={fetchComplaints}
              disabled={complaintsLoading}
              title={complaintsLoading ? "Refreshing..." : "Refresh complaints"}
            >
              <RefreshIcon className={complaintsLoading ? "spin" : ""} />
            </IconButton>
          </div>

          {filteredComplaints.length === 0 && <p className="muted">No complaints match your search.</p>}
          {renderComplaintGrid(filteredComplaints)}
        </section>
      )}

      {activeSection === sections.ANALYTICS && (
        <section className="section section--first">
          <Analytics
            analytics={analytics}
            aiAnalytics={aiAnalytics?.data}
            loading={analyticsLoading}
            onRefresh={() => { fetchAnalytics(); fetchAiAnalytics(); }}
          />
        </section>
      )}

      {activeSection === sections.USERS && role === "admin" && (
        <section className="section section--first">
          <div className="card">
            <div className="card__header">
              <div>
                <h3>Create User</h3>
                <p className="muted">Create tenant, technician, or manager accounts.</p>
              </div>
            </div>
            <CreateUserForm onUserCreated={fetchTechnicians} setNotice={setNotice} />
          </div>
        </section>
      )}

      {activeSection === sections.ACTIVITY && (
        <section className="section section--first">
          <ActivityFeed />
        </section>
      )}
    </DashboardShell>
  );
}

export default AdminDashboard;
