import IconButton from "./IconButton";
import { 
  RefreshIcon, 
  ClockIcon, 
  UserIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  InboxIcon,
  HammerIcon,
  XCircleIcon,
  ArchiveIcon,
  PlusIcon
} from "./icons";

const msToHours = (ms) => {
  if (!ms || Number.isNaN(Number(ms))) return "0";
  return (Number(ms) / (1000 * 60 * 60)).toFixed(1);
};

const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className={`card metric-card ${colorClass}`}>
    <div className="metric-card__content">
      <div className="metric-card__info">
        <span className="metric-card__title">{title}</span>
        <span className="metric-card__value">{value}</span>
      </div>
      <div className="metric-card__icon-wrapper">
        {Icon && <Icon className="metric-card__icon" />}
      </div>
    </div>
  </div>
);

const Analytics = ({ analytics, loading, onRefresh }) => {
  const overview = analytics?.overview;
  const priority = analytics?.priority;
  const time = analytics?.time;
  const technicians = analytics?.technicians;

  return (
    <div className="analytics-container">
      <header className="page__header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p className="muted">Real-time performance metrics and status tracking</p>
        </div>
        <IconButton
          onClick={onRefresh}
          disabled={loading}
          className="glass-button"
          title={loading ? "Refreshing..." : "Refresh analytics"}
        >
          <RefreshIcon className={loading ? "spin" : ""} />
        </IconButton>
      </header>

      <div className="analytics-grid">
        {/* Primary Row: Status Overviews */}
        <MetricCard 
          title="Total Requests" 
          value={overview?.totalComplaints ?? "0"} 
          icon={InboxIcon}
          colorClass="metric-card--primary"
        />
        <MetricCard 
          title="Avg. Resolution" 
          value={`${msToHours(time?.avgResolutionMs)}h`} 
          icon={ClockIcon}
          colorClass="metric-card--info"
        />
        <MetricCard 
          title="Active Techs" 
          value={technicians?.total ?? "0"} 
          icon={UserIcon}
          colorClass="metric-card--secondary"
        />
      </div>

      <div className="analytics-layout-grid">
        {/* Status Distribution Card */}
        <div className="card glass-card">
          <div className="card__header">
            <h4>Live Status</h4>
          </div>
          <div className="status-stats-grid">
            <div className="stat-pill status--new">
              <span className="pill-label">New</span>
              <span className="pill-value">{overview?.open ?? "0"}</span>
            </div>
            <div className="stat-pill status--assigned">
              <span className="pill-label">Assigned</span>
              <span className="pill-value">{overview?.assigned ?? "0"}</span>
            </div>
            <div className="stat-pill status--in-progress">
              <span className="pill-label">In Progress</span>
              <span className="pill-value">{overview?.inProgress ?? "0"}</span>
            </div>
            <div className="stat-pill status--completed">
              <span className="pill-label">Completed</span>
              <span className="pill-value">{overview?.completed ?? "0"}</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="card glass-card">
          <div className="card__header">
            <h4>Priority Breakdown</h4>
          </div>
          <div className="priority-list">
            <div className="priority-item">
              <span className="priority-tag priority--critical">Critical</span>
              <div className="priority-bar-bg">
                <div 
                  className="priority-bar-fill priority--critical" 
                  style={{ width: `${(priority?.critical / overview?.totalComplaints * 100) || 0}%` }}
                />
              </div>
              <span className="priority-count">{priority?.critical ?? "0"}</span>
            </div>
            <div className="priority-item">
              <span className="priority-tag priority--high">High</span>
              <div className="priority-bar-bg">
                <div 
                  className="priority-bar-fill priority--high" 
                  style={{ width: `${(priority?.high / overview?.totalComplaints * 100) || 0}%` }}
                />
              </div>
              <span className="priority-count">{priority?.high ?? "0"}</span>
            </div>
            <div className="priority-item">
              <span className="priority-tag priority--medium">Medium</span>
              <div className="priority-bar-bg">
                <div 
                  className="priority-bar-fill priority--medium" 
                  style={{ width: `${(priority?.medium / overview?.totalComplaints * 100) || 0}%` }}
                />
              </div>
              <span className="priority-count">{priority?.medium ?? "0"}</span>
            </div>
          </div>
        </div>

        {/* Performance Trends Card */}
        <div className="card glass-card">
          <div className="card__header">
            <h4>Today's Velocity</h4>
          </div>
          <div className="velocity-metrics">
            <div className="velocity-chip">
              <PlusIcon className="velocity-icon text-success" />
              <div className="velocity-info">
                <span className="velocity-value">{time?.todayCreated ?? "0"}</span>
                <span className="velocity-label">New Today</span>
              </div>
            </div>
            <div className="velocity-chip">
              <CheckCircleIcon className="velocity-icon text-info" />
              <div className="velocity-info">
                <span className="velocity-value">{time?.todayClosed ?? "0"}</span>
                <span className="velocity-label">Closed Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
  
