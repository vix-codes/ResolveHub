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

const CATEGORY_COLORS = {
  ELECTRICAL: "#eab308",
  PLUMBING:   "#3b82f6",
  SECURITY:   "#ef4444",
  STRUCTURAL: "#a855f7",
  HVAC:       "#0ea5e9",
  CLEANING:   "#22c55e",
  INTERNET:   "#6366f1",
  GENERAL:    "#64748b",
};

const AiCategoryBar = ({ category, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = CATEGORY_COLORS[category] || "#64748b";
  return (
    <div className="priority-item">
      <span
        className="priority-tag"
        style={{ color, fontSize: "0.7rem" }}
      >
        {category}
      </span>
      <div className="priority-bar-bg">
        <div
          className="priority-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="priority-count">{count}</span>
    </div>
  );
};

const AiAnalyticsSection = ({ aiAnalytics }) => {
  if (!aiAnalytics) return null;

  const { processing, confidence, categoryDistribution, criticalTrend, topTags } = aiAnalytics;
  const successRatePct = Math.round((processing?.successRate || 0) * 100);
  const avgConfidencePct = Math.round((confidence?.average || 0) * 100);
  const totalCategoryCount = (categoryDistribution || []).reduce((s, d) => s + d.count, 0);

  return (
    <div className="ai-analytics-section">
      <div className="ai-analytics-header">
        <h3 className="ai-analytics-title">AI Insights</h3>
        <span className="ai-analytics-subtitle">Gemini-powered complaint intelligence</span>
      </div>

      <div className="analytics-grid">
        <MetricCard
          title="AI Analyzed"
          value={processing?.completed ?? "0"}
          icon={CheckCircleIcon}
          colorClass="metric-card--secondary"
        />
        <MetricCard
          title="Avg. Confidence"
          value={`${avgConfidencePct}%`}
          icon={AlertCircleIcon}
          colorClass="metric-card--info"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRatePct}%`}
          icon={CheckCircleIcon}
          colorClass="metric-card--primary"
        />
      </div>

      <div className="analytics-layout-grid">
        {/* AI Category Distribution */}
        {categoryDistribution && categoryDistribution.length > 0 && (
          <div className="card glass-card">
            <div className="card__header">
              <h4>Category Distribution</h4>
            </div>
            <div className="priority-list">
              {categoryDistribution.map((d) => (
                <AiCategoryBar
                  key={d.category}
                  category={d.category}
                  count={d.count}
                  total={totalCategoryCount}
                />
              ))}
            </div>
          </div>
        )}

        {/* Critical Issue Trend */}
        <div className="card glass-card">
          <div className="card__header">
            <h4>Critical Trend (7 days)</h4>
          </div>
          {criticalTrend && criticalTrend.length > 0 ? (
            <div className="ai-trend-list">
              {criticalTrend.map((d) => (
                <div key={d.date} className="ai-trend-row">
                  <span className="ai-trend-date">{d.date}</span>
                  <div className="priority-bar-bg" style={{ flex: 1 }}>
                    <div
                      className="priority-bar-fill"
                      style={{
                        width: `${Math.min(100, d.count * 20)}%`,
                        background: "#ef4444",
                      }}
                    />
                  </div>
                  <span className="priority-count">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "var(--secondary-text)", padding: "8px 0" }}>
              No critical issues in the last 7 days.
            </p>
          )}
        </div>

        {/* AI Processing Status */}
        <div className="card glass-card">
          <div className="card__header">
            <h4>AI Processing Status</h4>
          </div>
          <div className="status-stats-grid">
            <div className="stat-pill" style={{ background: "rgba(34,197,94,0.1)" }}>
              <span className="pill-label">Completed</span>
              <span className="pill-value">{processing?.completed ?? "0"}</span>
            </div>
            <div className="stat-pill" style={{ background: "rgba(234,179,8,0.1)" }}>
              <span className="pill-label">Pending</span>
              <span className="pill-value">{processing?.pending ?? "0"}</span>
            </div>
            <div className="stat-pill" style={{ background: "rgba(239,68,68,0.1)" }}>
              <span className="pill-label">Failed</span>
              <span className="pill-value">{processing?.failed ?? "0"}</span>
            </div>
            <div className="stat-pill" style={{ background: "rgba(100,116,139,0.1)" }}>
              <span className="pill-label">Skipped</span>
              <span className="pill-value">{processing?.skipped ?? "0"}</span>
            </div>
          </div>
        </div>

        {/* Top Tags */}
        {topTags && topTags.length > 0 && (
          <div className="card glass-card">
            <div className="card__header">
              <h4>Top AI Tags</h4>
            </div>
            <div className="ai-tags-cloud">
              {topTags.map((t) => (
                <span key={t.tag} className="ai-tag-chip">
                  {t.tag}
                  <span className="ai-tag-count">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Analytics = ({ analytics, aiAnalytics, loading, onRefresh }) => {
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

      <AiAnalyticsSection aiAnalytics={aiAnalytics} />
    </div>
  );
};

export default Analytics;
