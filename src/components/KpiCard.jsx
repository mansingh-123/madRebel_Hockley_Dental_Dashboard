import React, { useState } from "react"

export default function KpiCard({ title, value, subtitle, variant = "kpi", className = "", sparkline, lineColor = "#2563eb", sparklineLabels, trendPct, trendLabel }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const isMetric = variant === "metric"
  const rootClass = isMetric ? "metric-card" : "kpi"
  const titleClass = isMetric ? "metric-title" : "kpi-title"
  const valueClass = isMetric ? "metric-value" : "kpi-value"
  const subClass = isMetric ? "metric-sub" : "kpi-sub"
  let path = null
  let area = null
  let points = []
  let dir = "neutral"
  if (typeof trendPct === "number") {
    dir = trendPct > 0 ? "up" : trendPct < 0 ? "down" : "neutral"
  }
  if (Array.isArray(sparkline) && sparkline.length > 1) {
    const min = Math.min(...sparkline)
    const max = Math.max(...sparkline)
    const range = max - min || 1
    const h = 56
    const baseline = h - 4
    path = sparkline.map((v, i) => {
      const x = (i / (sparkline.length - 1)) * 100
      const y = h - ((v - min) / range) * (h - 12) - 6
      points.push([x, y])
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    }).join(" ")
    if (points.length) {
      area = `M ${points[0][0]} ${points[0][1]} ` + points.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(" ") + ` L 100 ${baseline} L 0 ${baseline} Z`
    }
  }
  return (
    <div className={`${rootClass}${className ? ` ${className}` : ""}`}>
      {isMetric && (trendPct !== undefined || trendLabel) ? (
        <div className="metric-trend-badge">
         {/* {trendPct !== undefined ? <div className={`pct ${dir}`}>{(trendPct > 0 ? "+" : "") + (typeof trendPct === "number" ? trendPct.toFixed(1) : trendPct)}%</div> : null} 
          {trendLabel ? <div className="sub">{trendLabel}</div> : null} */}
        </div> 
      ) : null}
      <div className={titleClass}>{title}</div>
      <div className={valueClass}>{value}</div>
      {subtitle ? <div className={subClass}>{subtitle}</div> : null}
      {isMetric && path ? (
        <div className="sparkline-container" style={{ position: "relative" }}>
          <svg viewBox="0 0 100 56" preserveAspectRatio="none" width="100%" height="56" style={{ overflow: "visible" }}>
            {area ? <path d={area} fill={lineColor} opacity="0.12" /> : null}
            <path d={path} fill="none" stroke={lineColor} strokeWidth="2" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r="2.2" fill={lineColor} stroke="#ffffff" strokeWidth="0.8" />
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r="8"
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            ))}
          </svg>
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              style={{
                position: "absolute",
                left: `${points[hoveredIndex][0]}%`,
                top: `${(points[hoveredIndex][1] / 56) * 100}%`,
                transform: "translate(-50%, -130%)",
                background: "#1e293b",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                zIndex: 10,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              {sparkline[hoveredIndex]}
              <div
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid #1e293b",
                }}
              />
            </div>
          )}
        </div>
      ) : null}
      {isMetric && Array.isArray(sparklineLabels) && sparklineLabels.length === 2 ? (
        <div className="sparkline-labels">
          <span>{sparklineLabels[0]}</span>
          {/* <span>{sparklineLabels[1]}</span> */}
        </div>
      ) : null}
    </div>
  )
}
