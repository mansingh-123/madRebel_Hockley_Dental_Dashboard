import React from 'react'

export default function AiInsights({ data, loading, error }) {
  if (loading) {
    return (
      <div className="ai-dashboard">
        <div className="ai-dashboard-head">
          <span>AI Insights</span>
          <span className="ai-live">
            <span className="status-dot" style={{ animation: "pulse 1.5s infinite" }}></span> Generating...
          </span>
        </div>
        <div className="ai-tiles">
          <div className="ai-tile" style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>Analyzing performance trends...</div>
          </div>
          <div className="ai-tile" style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>Identifying action items...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-dashboard" style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", border: "1px solid #475569" }}>
        <div className="ai-dashboard-head">
          <span style={{ color: "#fca5a5" }}>AI Insights Unavailable</span>
          <span className="ai-live" style={{ color: "#fca5a5" }}>Error</span>
        </div>
        <div className="ai-tile" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚠️</div>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>Unable to generate insights</div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="ai-dashboard">
      <div className="ai-dashboard-head">
        <span>AI Insights</span>
        <span className="ai-live">
          <span className="status-dot"></span> Live Analysis
        </span>
      </div>

      <div className="ai-tiles">
        <div className="ai-tile">
          <div style={{ marginBottom: "12px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>
            Key Observations
          </div>
          <ul className="ai-list">
            {data.insights?.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
            {(!data.insights || data.insights.length === 0) && (
              <li style={{ opacity: 0.6, fontStyle: "italic" }}>No specific insights found for this period.</li>
            )}
          </ul>
        </div>

        <div className="ai-tile">
          <div style={{ marginBottom: "12px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>
            Recommended Actions
          </div>
          <ul className="actions-list">
            {data.action_items?.map((item, i) => (
              <li key={i}>
                <span className="lead" style={{ color: "#fff", fontWeight: "500" }}>{item}</span>
              </li>
            ))}
            {(!data.action_items || data.action_items.length === 0) && (
              <li style={{ paddingLeft: 0, opacity: 0.6, fontStyle: "italic" }}>No immediate actions required.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
