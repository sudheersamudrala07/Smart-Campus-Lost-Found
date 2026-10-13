import React from "react";

/**
 * ============================================================================
 * Review a history of report, category, and claim decisions.
 * ============================================================================
 */
function AuditLogsView({ logs, onRefresh }) {
  const getActionBadgeClass = (action) => {
    if (action.includes("DELETE")) return "badge-del";
    return "badge-gen";
  };

  return (
    <div className="audit-view-container">
      <div className="section-heading-card">
        <div>
          <h2>📜 Activity history</h2>
          <p className="section-subtext">
            See recent changes made to reports, categories, and claim requests.
          </p>
        </div>
        <button type="button" className="refresh-btn" onClick={onRefresh} title="Refresh Logs">
          🔄
        </button>
      </div>

      <div className="audit-logs-card">
        {logs.length === 0 ? (
          <div className="state-message empty-message">
            <p>No audit log events recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sql-result-table">
              <thead>
                <tr>
                  <th>Log ID (PK)</th>
                  <th>Action Event</th>
                  <th>Target Table</th>
                  <th>Record ID</th>
                  <th>Details & Change Audit</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id}>
                    <td><strong>#{log.log_id}</strong></td>
                    <td>
                      <span className={`log-action-pill ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td><code>{log.table_name}</code></td>
                    <td>{log.record_id ? `#${log.record_id}` : "-"}</td>
                    <td className="log-details-cell">{log.details}</td>
                    <td className="log-time-cell">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogsView;
