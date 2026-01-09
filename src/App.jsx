import React, { useState } from "react"
import CsvUploader from "./components/CsvUploader.jsx"
import KpiCard from "./components/KpiCard.jsx"
import ChartCard from "./components/ChartCard.jsx"
import TrendTable from "./components/TrendTable.jsx"
import ErrorState from "./components/ErrorState.jsx"
import { computeKpis, sampleMonthlyData, monthsFromData } from "./utils/kpi.js"
import { API_BASE, API_PATH, API_STYLE } from "./config.js"
import { fetchMonthlyKpi, buildApiUrl } from "./services/data.js"

function getIdFromUrl() {
  const { pathname } = window.location
  const m = pathname.match(/^\/id:([A-Za-z0-9_-]+)$/)
  return m ? m[1] : ""
}

export default function App() {
  const [rows, setRows] = useState(sampleMonthlyData)
  const [kpis, setKpis] = useState(computeKpis(rows))
  const months = monthsFromData(rows)
  const [loading, setLoading] = useState(false)
  const [entityId, setEntityId] = useState(getIdFromUrl())

  function onData(newRows) {
    setRows(newRows)
    setKpis(computeKpis(newRows))
  }

  React.useEffect(() => {
    if (!API_BASE) return
    let alive = true
    const id = getIdFromUrl()
    setEntityId(id)
    if (!id) { setLoading(false); return }
    const url = buildApiUrl({ base: API_BASE, path: API_PATH, style: API_STYLE, id })
    setLoading(true)
    fetchMonthlyKpi(url)
      .then(r => { if (alive) onData((Array.isArray(r) && r.length) ? r : sampleMonthlyData) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  function weekOfLabel() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `Week of ${months[monday.getMonth()]} ${String(monday.getDate()).padStart(2,"0")}, ${monday.getFullYear()}`
  }

  const mockInsights = [
    "New patients trending down vs prior month — monitor recovery closely.",
    `Net growth positive (+${Number(kpis.latest.netPatientGrowth || 0)}) but softening — review retention drivers.`,
    `Collection ratio at ${Number(kpis.latest.collectionRatioPct || 0)}% — AR appears healthy.`,
    "ORTHO holding near 30% of total production — steady.",
    `$${Number(kpis.latest.lostProduction || 0).toLocaleString()} lost to cancellations/no-shows — material impact.`
  ]
  const mockActions = [
    "Launch reactivation campaign — target recent inactives.",
    "Review no-show patterns — consider overbooking or card-on-file.",
    "Case presentation refresher — add financing options."
  ]

  function splitLead(text) {
    const idxDash = text.indexOf(" — ")
    if (idxDash > -1) return [text.slice(0, idxDash), text.slice(idxDash + 3)]
    const idxColon = text.indexOf(": ")
    if (idxColon > -1) return [text.slice(0, idxColon), text.slice(idxColon + 2)]
    const idxPeriod = text.indexOf(". ")
    if (idxPeriod > -1) return [text.slice(0, idxPeriod + 1), text.slice(idxPeriod + 2)]
    return [text, ""]
  }

  if (!entityId) {
    return (
      <div className="page">
        <header className="header">
          <div className="brand">Hockley Dental KPI Dashboard</div>
        </header>
        <ErrorState />
      </div>
    )
  }
  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div className="brand">Hockley Dental KPI Dashboard</div>
          <div className="controls">
            {!API_BASE && <CsvUploader onData={onData} />}
            {API_BASE && (
              <>
                <span className="kpi-title">{loading ? "Loading…" : "Live API"}</span>
                <span className="badge">ID: {entityId || "—"}</span>
              </>
            )}
          </div>
        </header>

      <section className="summary">
        <KpiCard title="Active Patients" value={Number(kpis.latest.activePatients || 0)} />
        <KpiCard title="New Patients" value={Number(kpis.latest.newPatients || 0)} />
        <KpiCard title="New Patient Goal" value={Number(kpis.latest.newPatientGoal || 0)} subtitle="Monthly target" />
        <KpiCard title="Lost Patients" value={Number(kpis.latest.lostPatients || 0)} />
        <KpiCard title="Net Patient Growth" value={Number(kpis.latest.netPatientGrowth || 0)} />

        <KpiCard title="Production — General" value={'$' + Number(kpis.latest.productionGeneral || 0).toLocaleString()} />
        <KpiCard title="Production — ORTHO" value={'$' + Number(kpis.latest.productionOrtho || 0).toLocaleString()} />
        <KpiCard title="Collections — General" value={'$' + Number(kpis.latest.collectionsGeneral || 0).toLocaleString()} />
        <KpiCard title="Collections — ORTHO" value={'$' + Number(kpis.latest.collectionsOrtho || 0).toLocaleString()} />
        <KpiCard title="Collection Ratio" value={Number(kpis.latest.collectionRatioPct || 0) + '%'} subtitle="Collections ÷ Production" />

        <KpiCard title="Lost Production $" value={'$' + Number(kpis.latest.lostProduction || 0).toLocaleString()} subtitle="Cancelled + No-show" />
        <KpiCard title="Cancelled $" value={'$' + Number(kpis.latest.lostCancelled || 0).toLocaleString()} subtitle="From cancellations" />
        <KpiCard title="No-Show $" value={'$' + Number(kpis.latest.lostNoShow || 0).toLocaleString()} subtitle="From no-shows" />

        <KpiCard title="Cancellation Rate" value={`${Number(kpis.latest.cancellationRatePct || 0)}%`} subtitle={`${Number(kpis.latest.cancelledAppointments || 0)} of ${Number(kpis.latest.scheduledAppointments || 0)} appts`} />
        <KpiCard title="No-Show Rate" value={`${Number(kpis.latest.noShowRatePct || 0)}%`} subtitle={`${Number(kpis.latest.noShowAppointments || 0)} of ${Number(kpis.latest.scheduledAppointments || 0)} appts`} />
        <KpiCard title="Fill Rate" value={Number(kpis.latest.fillRatePct || 0) + '%'} subtitle="Chairs utilized" />
        <KpiCard title="Treatment Acceptance" value={Number(kpis.latest.treatmentAcceptancePct || 0) + '%'} />
      </section>

      <section className="grid">
        <ChartCard
          title="Production"
          months={months}
          datasets={[
            { label: "General", data: kpis.series.productionGeneral, color: "#2563eb" },
            { label: "ORTHO", data: kpis.series.productionOrtho, color: "#ef4444" }
          ]}
          type="bar"
        />
        <ChartCard
          title="Collections"
          months={months}
          datasets={[
            { label: "General", data: kpis.series.collectionsGeneral, color: "#16a34a" },
            { label: "ORTHO", data: kpis.series.collectionsOrtho, color: "#f59e0b" }
          ]}
          type="bar"
        />
        <ChartCard
          title="New Patients vs Goal"
          months={months}
          datasets={[
            { label: "New Patients", data: kpis.series.newPatients, color: "#22c55e" },
            { label: "Goal", data: kpis.series.newPatientGoal, color: "#a3a3a3" }
          ]}
          type="line"
        />
        <ChartCard
          title="Collection Ratio"
          months={months}
          datasets={[
            { label: "Ratio %", data: kpis.series.collectionRatioPct, color: "#9333ea" }
          ]}
          type="line"
        />
        <ChartCard
          title="Cancellation Rate"
          months={months}
          datasets={[
            { label: "Cancelled %", data: kpis.series.cancellationRatePct, color: "#e11d48" }
          ]}
          type="line"
        />
        <ChartCard
          title="No-Show Rate"
          months={months}
          datasets={[
            { label: "No-Show %", data: kpis.series.noShowRatePct, color: "#0ea5e9" }
          ]}
          type="line"
        />
        <ChartCard
          title="Net Patient Growth"
          months={months}
          datasets={[
            { label: "Net", data: kpis.series.netPatientGrowth, color: "#22c55e" },
            { label: "Goal", data: kpis.series.newPatientGoal, color: "#a3a3a3" }
          ]}
          type="line"
        />
        <ChartCard
          title="Treatment Acceptance"
          months={months}
          datasets={[
            { label: "Acceptance %", data: kpis.series.treatmentAcceptancePct, color: "#3b82f6" }
          ]}
          type="line"
        />
        <ChartCard
          title="Fill Rate"
          months={months}
          datasets={[
            { label: "Fill Rate %", data: kpis.series.fillRatePct, color: "#10b981" }
          ]}
          type="line"
        />
      </section>

      <section className="trend">
        <TrendTable rows={rows} />
      </section>

      <section className="insights">
        <div className="panel panel-insights">
          <div className="panel-title">AI Insights — <span className="badge">Week of {weekOfLabel().split('Week of ')[1]}</span></div>
          <ul className="insights-list">
            {((kpis.latest.aiInsights && kpis.latest.aiInsights.length) ? kpis.latest.aiInsights : mockInsights).map((x, i) => {
              const [lead, rest] = splitLead(x)
              return (
                <li key={i}>
                  <span className="lead">{lead}</span>
                  {rest ? <span className="rest"> {rest}</span> : null}
                </li>
              )
            })}
          </ul>
        </div>
        <div className="panel panel-actions">
          <div className="panel-title">Action Items — <span className="badge success">This Week</span></div>
          <ul className="actions-list">
            {((kpis.latest.actionItems && kpis.latest.actionItems.length) ? kpis.latest.actionItems : mockActions).map((x, i) => {
              const [lead, rest] = splitLead(x)
              return (
                <li key={i}>
                  <span className="lead">{lead}</span>
                  {rest ? <span className="rest"> {rest}</span> : null}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <footer className="footer">
        <div>Powered by MedRebel</div>
        <div>AI insights generated by Claude</div>
      </footer>
      </div>
    </div>
  )
}
