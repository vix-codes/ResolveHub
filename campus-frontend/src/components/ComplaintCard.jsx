import StatusPipeline from "./StatusPipeline";

const CATEGORY_COLORS = {
  ELECTRICAL: { bg: "rgba(234, 179, 8, 0.15)", text: "#854d0e", border: "rgba(234, 179, 8, 0.4)" },
  PLUMBING:   { bg: "rgba(59, 130, 246, 0.15)", text: "#1e40af", border: "rgba(59, 130, 246, 0.4)" },
  SECURITY:   { bg: "rgba(239, 68, 68, 0.15)",  text: "#991b1b", border: "rgba(239, 68, 68, 0.4)" },
  STRUCTURAL: { bg: "rgba(168, 85, 247, 0.15)", text: "#6b21a8", border: "rgba(168, 85, 247, 0.4)" },
  HVAC:       { bg: "rgba(14, 165, 233, 0.15)", text: "#0c4a6e", border: "rgba(14, 165, 233, 0.4)" },
  CLEANING:   { bg: "rgba(34, 197, 94, 0.15)",  text: "#166534", border: "rgba(34, 197, 94, 0.4)" },
  INTERNET:   { bg: "rgba(99, 102, 241, 0.15)", text: "#3730a3", border: "rgba(99, 102, 241, 0.4)" },
  GENERAL:    { bg: "rgba(100, 116, 139, 0.15)", text: "#334155", border: "rgba(100, 116, 139, 0.4)" },
};

const PRIORITY_COLORS = {
  CRITICAL: { bg: "rgba(239, 68, 68, 0.15)",  text: "#b91c1c", border: "rgba(239, 68, 68, 0.5)" },
  HIGH:     { bg: "rgba(249, 115, 22, 0.15)", text: "#c2410c", border: "rgba(249, 115, 22, 0.5)" },
  MEDIUM:   { bg: "rgba(234, 179, 8, 0.15)",  text: "#854d0e", border: "rgba(234, 179, 8, 0.5)" },
  LOW:      { bg: "rgba(34, 197, 94, 0.15)",  text: "#166534", border: "rgba(34, 197, 94, 0.5)" },
};

const AiBadge = ({ label, colorStyle }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: "6px",
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: colorStyle?.bg || "rgba(100,116,139,0.1)",
      color: colorStyle?.text || "#334155",
      border: `1px solid ${colorStyle?.border || "rgba(100,116,139,0.3)"}`,
    }}
  >
    {label}
  </span>
);

const ConfidenceBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color =
    pct >= 85 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          background: "rgba(100,116,139,0.15)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color, minWidth: 32 }}>
        {pct}%
      </span>
    </div>
  );
};

const AiPanel = ({ complaint }) => {
  const { aiStatus, aiCategory, aiPriority, aiConfidence, aiSummary, aiSuggestedRouting, priorityManuallyOverridden } = complaint;

  if (!aiStatus || aiStatus === "SKIPPED") return null;

  if (aiStatus === "PENDING") {
    return (
      <div className="ai-panel ai-panel--pending">
        <span className="ai-panel__label">AI</span>
        <span style={{ fontSize: "0.8rem", color: "var(--secondary-text)" }}>
          Analyzing&hellip;
        </span>
      </div>
    );
  }

  if (aiStatus === "FAILED") {
    return (
      <div className="ai-panel ai-panel--failed">
        <span className="ai-panel__label">AI</span>
        <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>
          Analysis unavailable
        </span>
      </div>
    );
  }

  if (aiStatus !== "COMPLETED" || !aiCategory) return null;

  const catColor  = CATEGORY_COLORS[aiCategory]  || CATEGORY_COLORS.GENERAL;
  const priColor  = PRIORITY_COLORS[aiPriority]   || PRIORITY_COLORS.MEDIUM;

  return (
    <div className="ai-panel">
      <div className="ai-panel__header">
        <span className="ai-panel__label">AI Analysis</span>
        {priorityManuallyOverridden && (
          <span className="ai-panel__override-note">priority overridden</span>
        )}
      </div>

      <div className="ai-panel__badges">
        <AiBadge label={aiCategory} colorStyle={catColor} />
        {aiPriority && <AiBadge label={aiPriority} colorStyle={priColor} />}
      </div>

      {typeof aiConfidence === "number" && (
        <div className="ai-panel__confidence">
          <span className="ai-panel__field-label">Confidence</span>
          <ConfidenceBar value={aiConfidence} />
        </div>
      )}

      {aiSummary && (
        <p className="ai-panel__summary">{aiSummary}</p>
      )}

      {aiSuggestedRouting && (
        <p className="ai-panel__routing">
          <span className="ai-panel__field-label">Routing: </span>
          {aiSuggestedRouting}
        </p>
      )}
    </div>
  );
};

const ComplaintCard = ({
    complaint,
    technicians,
    onAssign,
    onPriorityChange,
    onClose,
    onReopen,
    onDelete,
  }) => {
    const canClose = ["COMPLETED", "IN_PROGRESS", "ASSIGNED"].includes(complaint.status);
    const canReopen = ["REJECTED", "CLOSED", "COMPLETED"].includes(complaint.status);

    return (
      <div className="card glass-card">
        <div className="card__header">
          <div className="card__title-group">
            <h4 className="card__title">{complaint.title}</h4>
            <p className="secondary-text card__description">{complaint.description}</p>
          </div>
          <span
            className={`status status--${complaint.status
              ?.toLowerCase()
              .replaceAll("_", "-")}`}
          >
            {complaint.status?.replaceAll("_", " ")}
          </span>
        </div>

        <StatusPipeline currentStatus={complaint.status} />

        {complaint.image && (
          <img
            className="card__image"
            src={complaint.image}
            alt={`${complaint.title} evidence`}
          />
        )}

        <div className="card__meta">
          {complaint.token && <p>Token: <strong>{complaint.token}</strong></p>}
          <p>Priority: <strong style={{ textTransform: 'capitalize' }}>{complaint.priority || "Medium"}</strong></p>
          {complaint.createdAt && (
            <p>Created: {new Date(complaint.createdAt).toLocaleString()}</p>
          )}
          {complaint.createdBy && <p>By: {complaint.createdBy.name}</p>}
        </div>

        <AiPanel complaint={complaint} />

        <div className="card__actions">
          <select
            className="input"
            onChange={(e) => onAssign(complaint._id, e.target.value)}
            value={complaint.assignedTo?._id || ""}
          >
            <option value="" disabled>
              Assign to
            </option>
            {(technicians || []).map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          <select
            className="input"
            onChange={(e) => onPriorityChange(complaint._id, e.target.value)}
            value={complaint.priority || ""}
          >
            <option value="" disabled>
              Set priority
            </option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {onClose && (
            <button
              className="button button--primary"
              onClick={() => onClose(complaint._id)}
              disabled={!canClose}
              title={complaint.status === "COMPLETED" ? "Close complaint" : "Force close in-progress complaint"}
            >
              {complaint.status === "COMPLETED" ? "Close" : "Force Close"}
            </button>
          )}

          {onReopen && (
            <button
              className="button button--ghost"
              onClick={() => onReopen(complaint._id)}
              disabled={!canReopen}
              title={canReopen ? "Reopen complaint" : "Only rejected/closed complaints can be reopened"}
            >
              Reopen
            </button>
          )}

          {onDelete && (
            <button
              className="button button--danger"
              onClick={() => onDelete(complaint._id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

export default ComplaintCard;
