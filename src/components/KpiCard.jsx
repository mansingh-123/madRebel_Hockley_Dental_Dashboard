import React from "react"

export default function KpiCard({ title, value, subtitle, variant = "kpi", className = "", sparkline, lineColor = "#2563eb", sparklineLabels, trendPct, trendLabel }) {
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
          {trendPct !== undefined ? <div className={`pct ${dir}`}>{(trendPct > 0 ? "+" : "") + (typeof trendPct === "number" ? trendPct.toFixed(1) : trendPct)}%</div> : null}
          {trendLabel ? <div className="sub">{trendLabel}</div> : null}
        </div>
      ) : null}
      <div className={titleClass}>{title}</div>
      <div className={valueClass}>{value}</div>
      {subtitle ? <div className={subClass}>{subtitle}</div> : null}
      {isMetric && path ? (
        <div className="sparkline-container">
          <svg viewBox="0 0 100 56" preserveAspectRatio="none" width="100%" height="56">
            {area ? <path d={area} fill={lineColor} opacity="0.12" /> : null}
            <path d={path} fill="none" stroke={lineColor} strokeWidth="2" />
            {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill={lineColor} stroke="#ffffff" strokeWidth="0.8" />)}
          </svg>
        </div>
      ) : null}
      {isMetric && Array.isArray(sparklineLabels) && sparklineLabels.length === 2 ? (
        <div className="sparkline-labels">
          <span>{sparklineLabels[0]}</span>
          <span>{sparklineLabels[1]}</span>
        </div>
      ) : null}
    </div>
  )
}
