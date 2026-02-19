import React, { useState } from "react"
import KpiCard from "./components/KpiCard.jsx"
import ChartCard from "./components/ChartCard.jsx"
import TrendTable from "./components/TrendTable.jsx"
import ErrorState from "./components/ErrorState.jsx"
import { computeKpis, monthsFromData } from "./utils/kpi.js"
import { generateAiInsights, fetchLocationDetails, uploadDentalCsv } from "./services/data.js"
import CsvUploader from "./components/CsvUploader.jsx"
import { fetchDentalMonthlyReport } from "./services/data.js"


function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get("locationId")
  return id ? String(id) : ""
}

function getOnboardedFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const v = (params.get("onboarded") || "").toLowerCase()
  return v === "yes" || v === "true" || v === "1"
}

export default function App({ locationId }) {
  const [rows, setRows] = useState(null)
  const [kpis, setKpis] = useState(null)
  const months = rows ? monthsFromData(rows) : []
  const monthOrder = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
]

const sortedIndexes = months
  .map((m, i) => ({ month: m, index: i }))
  .sort((a, b) =>
    monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  )

const sortedMonths = sortedIndexes.map(x => x.month)
function sortSeries(arr) {
  if (!arr) return []
  return sortedIndexes.map(x => arr[x.index])
}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [aiInsights, setAiInsights] = useState([])
  const [aiActions, setAiActions] = useState([])
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'short' }))
  const [dataSource, setDataSource] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Generate last 7 months (Current + 6 previous)
  const availableMonths = React.useMemo(() => {
    const options = []
    const d = new Date()
    for (let i = 0; i < 7; i++) {
      const y = d.getFullYear()
      const m = d.toLocaleString('en-US', { month: 'short' })
      options.push({ year: y, month: m, label: `${m} ${y}` })
      d.setMonth(d.getMonth() - 1)
    }
    return options
  }, [])

  const [selectedDate, setSelectedDate] = useState(availableMonths[0].label)

  function handleDateChange(e) {
    const val = e.target.value
    setSelectedDate(val)
    const opt = availableMonths.find(o => o.label === val)
    if (opt) {
      setSelectedYear(opt.year)
      setSelectedMonth(opt.month)
    }
  }

  function onData(newRows) {
    setRows(newRows)
    setKpis(computeKpis(newRows))
  }

  const handleCsvUpload = async (newRows, file) => {
    onData(newRows)
    setShowUploadModal(false)
    if (file && locationId) {
      if (!(file instanceof File)) {
        console.error("Invalid file object")
        alert("Error: Invalid file object. Please try again.")
        return
      }
      const res = await uploadDentalCsv(locationId, file)
      if (res && res.status === "error") {
        alert("Upload failed: " + res.message)
      } else {
        alert("CSV uploaded successfully!")
      }
    }
  }

  const [showLeakage, setShowLeakage] = React.useState(false)
  const [showOptimization, setShowOptimization] = React.useState(false)

  {/*React.useEffect(() => {
    // if (!API_BASE) return
    let alive = true
    if (!locationId) { setLoading(false); return }
    
    // Pass selected year/month to URL builder
    const url = buildApiUrl({ 
      base: API_BASE, 
      path: API_PATH, 
      style: API_STYLE, 
      id: locationId,
      year: selectedYear,
      month: selectedMonth
    })
    
    setLoading(true)
    setError(false)
    fetchMonthlyKpi(url)
      .then(r => { 
        if (alive) onData((Array.isArray(r) && r.length) ? r : sampleMonthlyData) 
      })
      .catch(() => {
        if (alive) setError(true)
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [locationId, selectedYear, selectedMonth]) */}

 {/* React.useEffect(() => {
  let alive = true
  if (!locationId) { setLoading(false); return }

  setLoading(true)
  setError(false)

  fetchDentalMonthlyReport(locationId, selectedYear, selectedMonth)
    .then(res => {
      if (!alive) return

      if (res?.status === "success" && res.calculated_data) {
        const newRows = Array.isArray(res.calculated_data)
          ? res.calculated_data
          : [res.calculated_data]

        onData(newRows)
      } else {
        setError(true)
      }
    })
    .catch(() => {
      if (alive) setError(true)
    })
    .finally(() => {
      if (alive) setLoading(false)
    })

  return () => { alive = false }
}, [locationId, selectedYear, selectedMonth]) */}


React.useEffect(() => {
    let alive = true
    if (!locationId) { setLoading(false); return }

    setLoading(true)
    setError(false)
    setErrorMessage("")

    fetchDentalMonthlyReport(locationId, selectedYear, selectedMonth)
      .then(res => {
        if (!alive) return

         if (res?.status === "success") {
          const csv = res.csv_data
          const calc = res.calculated_data
          console.log("NEW PATIENT GOAL FROM API:", csv.new_patient_goal)

        const allMonths = [
    ...(res.last_6_months || []),
    {
      month: res.month,
      year: res.year,
      csv_data: res.csv_data,
      calculated_data: res.calculated_data
    }
  ]
  
  const transformedRows = allMonths.map(item => {
    const csv = item.csv_data || {}
    const calc = item.calculated_data || {}
  
    return {
      month: item.month,
      active_patients: csv.active_patients,
      new_patients: csv.new_patients,
      new_patient_goal: csv.new_patient_goal,
      lost_patients: csv.lost_patients,
      production_general: csv.production_general,
      production_ortho: csv.production_ortho,
      collections_general: csv.collections_general,
      collections_ortho: csv.collections_ortho,
      scheduled_appointments: csv.scheduled_appts,
      cancelled_appointments: csv.cancelled,
      no_show_appointments: csv.no_shows,
      lost_production: calc.lost_production,
      lost_cancelled: csv.cancelled_production,
      lost_noshow: csv.no_show_production,
      treatment_proposed: csv.treatment_proposed,
      treatment_accepted: csv.treatment_accepted
    }
  })
  
  onData(transformedRows)
  
        } else {
          if (res?.message && res.message.includes("No data found")) {
            setErrorMessage(res.message)
            onData([])
          } else {
            setError(true)
          }
        } 
      })
      .catch((err) => {
        console.error("Dashboard Error:", err)
        if (alive) setError(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
  
    return () => { alive = false }
  }, [locationId, selectedYear, selectedMonth])



  React.useEffect(() => {
    let alive = true
    if (!locationId) return
    fetchLocationDetails(locationId).then(res => {
      if (!alive) return
      if (res && res.data_source) {
        setDataSource(res.data_source)
      }
    }).catch(() => {})
    return () => { alive = false }
  }, [locationId])

  React.useEffect(() => {
    let alive = true
    if (!locationId) return

    // Clear previous insights when changing month/year
    setAiInsights([])
    setAiActions([])

    generateAiInsights(locationId, selectedYear, selectedMonth)
      .then(res => {
        if (!alive || !res || !res.ai_response) return
        const ai = res.ai_response || {}
        if (Array.isArray(ai.insights)) setAiInsights(ai.insights)
        if (Array.isArray(ai.action_items)) setAiActions(ai.action_items)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [locationId, selectedYear, selectedMonth])

  if (error) {
    return (
      <div className="page dental">
        <div className="container">
          <ErrorState 
            title="Oops! Something went wrong" 
            message="We couldn't load your dashboard data. Please try refreshing the page."
            icon="⚠️" 
          />
        </div>
      </div>
    )
  }

  function pctLocal(numerator, denominator) {
    const n = Number(numerator || 0)
    const d = Number(denominator || 0)
    if (!d || d <= 0) return 0
    return Math.round((n / d) * 100)
  }
  function latestFromRow(r) {
    const latest = r || {}
    const latestCollectionRatio = pctLocal((latest.collections_general || 0) + (latest.collections_ortho || 0), (latest.production_general || 0) + (latest.production_ortho || 0))
    const latestCancellationRate = pctLocal(latest.cancelled_appointments || 0, latest.scheduled_appointments || 0)
    const latestNoShowRate = pctLocal(latest.no_show_appointments || 0, latest.scheduled_appointments || 0)
    const latestFillRate = (() => {
      const scheduled = latest.scheduled_appointments || 0
      const cancelled = latest.cancelled_appointments || 0
      const noShow = latest.no_show_appointments || 0
      const filled = scheduled - cancelled - noShow
      return pctLocal(filled, scheduled)
    })()
    const latestNetGrowth = (latest.new_patients || 0) - (latest.lost_patients || 0)
    const latestTreatmentAcc = pctLocal(latest.treatment_accepted || 0, latest.treatment_proposed || 0)
    return {
      activePatients: latest.active_patients || 0,
      newPatients: latest.new_patients || 0,
      newPatientGoal: latest.new_patient_goal || 200,
      lostPatients: latest.lost_patients || 0,
      netPatientGrowth: latestNetGrowth,
      productionGeneral: latest.production_general || 0,
      productionOrtho: latest.production_ortho || 0,
      productionTotal: (latest.production_general || 0) + (latest.production_ortho || 0),
      collectionsGeneral: latest.collections_general || 0,
      collectionsOrtho: latest.collections_ortho || 0,
      collectionsTotal: (latest.collections_general || 0) + (latest.collections_ortho || 0),
      collectionRatioPct: latestCollectionRatio,
      cancellationRatePct: latestCancellationRate,
      noShowRatePct: latestNoShowRate,
      fillRatePct: latestFillRate,
      lostProduction: latest.lost_production || 0,
      lostCancelled: latest.lost_cancelled || 0,
      lostNoShow: latest.lost_noshow || 0,
      scheduledAppointments: latest.scheduled_appointments || 0,
      noShowAppointments: latest.no_show_appointments || 0,
      treatmentAcceptancePct: latestTreatmentAcc
    }
  }
  const selectedIndex = months.findIndex(m => m === selectedMonth)
  const latestView = latestFromRow((rows && rows.length > 0 ? (selectedIndex > -1 ? rows[selectedIndex] : rows[rows.length - 1]) : {}) || {})
  function weekOfLabel() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `Week of ${months[monday.getMonth()]} ${String(monday.getDate()).padStart(2,"0")}, ${monday.getFullYear()}`
  }

  function pctTrend(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return 0
    const first = Number(arr[0] || 0)
    const last = Number(arr[arr.length - 1] || 0)
    if (!first) return 0
    return ((last - first) / first) * 100
  }

  const mockInsights = [
    "New patients trending down vs prior month — monitor recovery closely.",
    `Net growth positive (+${Number(latestView.netPatientGrowth || 0)}) but softening — review retention drivers.`,
    `Collection ratio at ${Number(latestView.collectionRatioPct || 0)}% — AR appears healthy.`,
    "ORTHO holding near 30% of total production — steady.",
    `$${Number(latestView.lostProduction || 0).toLocaleString()} lost to cancellations/no-shows — material impact.`
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

  if (loading && !rows) {
    return (
      <div className="page dental">
        <div className="container">
          <header className="header">
            <div className="brand">DENTAL Dashboard</div>
            <div className="controls">
              <span><span className="status-dot"></span>Loading...</span>
            </div>
          </header>
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading dashboard data...
          </div>
        </div>
      </div>
    )
  }

  if (!rows || !kpis) {
    return (
      <div className="page dental">
        <div className="container">
          <header className="header">
            <div className="brand">DENTAL Dashboard</div>
            <div className="controls">
              <span><span className="status-dot" style={{background:"#ef4444"}}></span>No Data</span>
            </div>
          </header>
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            {errorMessage || "No data available for this period."}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page dental">
      <div className="container">
        <header className="header">
          <div className="brand">DENTAL Dashboard</div>
          <div className="controls">
            {dataSource === "CSV" && (
              <button className="badge btn-upload" onClick={() => setShowUploadModal(true)}>
                Upload CSV
              </button>
            )}
            <span><span className="status-dot"></span>{loading ? "Loading…" : "Live API"}</span>
            <span className="badge">ID: {locationId || "—"}</span>
            <span>
              <select className="badge" value={selectedDate} onChange={handleDateChange}>
                {availableMonths.map((opt, i) => (
                  <option key={i} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </span>
          </div>
        </header>

      <div className="tiers-bar">
        <span className="tier-pill t1"><span className="dot"></span>Executive Snapshot</span>
        <span className="tier-pill t2"><span className="dot"></span>Growth & Revenue Drivers</span>
        <span className="tier-pill t3"><span className="dot"></span>Operational Leakage</span>
        <span className="tier-pill t4"><span className="dot"></span>Efficiency & Optimization</span>
      </div>

      {errorMessage && (
        <div style={{
          background: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage("")}
            style={{
              background: "transparent",
              border: "none",
              color: "#b91c1c",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >✕</button>
        </div>
      )}

      <section className="panel tier-section">
        <div className="panel-title">Executive Snapshot</div>
        <div className="summary summary-top">
        <KpiCard
          variant="metric"
          title="Active Patients"
          value={Number(latestView.activePatients || 0)}
          subtitle="Total active patients • All locations · Current period"
          sparkline={kpis.series.activePatients}
          lineColor="#22c55e"
          sparklineLabels={[months[0], months[months.length - 1]]}
          trendPct={pctTrend(kpis.series.activePatients)}
          trendLabel="vs start of period"
        />
        <KpiCard
          variant="metric"
          title="Net Patient Growth"
          value={Number(latestView.netPatientGrowth || 0)}
          subtitle="New patients − lost patients • Last month"
          sparkline={kpis.series.netPatientGrowth}
          lineColor="#22c55e"
          sparklineLabels={[months[0], months[months.length - 1]]}
          trendPct={pctTrend(kpis.series.netPatientGrowth)}
          trendLabel="vs start of period"
        />
        <KpiCard
          variant="metric"
          title="Production — Total"
          value={'$' + Number(latestView.productionTotal || 0).toLocaleString()}
          subtitle="Total production (General + Ortho) • Current month"
          sparkline={kpis.series.productionTotal}
          lineColor="#3b82f6"
          sparklineLabels={[months[0], months[months.length - 1]]}
          trendPct={pctTrend(kpis.series.productionTotal)}
          trendLabel="vs start of period"
        />
        <KpiCard
          variant="metric"
          title="Collections — Total"
          value={'$' + Number(latestView.collectionsTotal || 0).toLocaleString()}
          subtitle="Total collections (General + Ortho) • Current month"
          sparkline={kpis.series.collectionsTotal}
          lineColor="#22c55e"
          sparklineLabels={[months[0], months[months.length - 1]]}
          trendPct={pctTrend(kpis.series.collectionsTotal)}
          trendLabel="vs start of period"
        />
        <KpiCard
          variant="metric"
          title="Collection Ratio"
          value={Number(latestView.collectionRatioPct || 0) + '%'}
          subtitle="Collections ÷ Production • Target: 95%+"
          sparkline={kpis.series.collectionRatioPct}
          lineColor="#a855f7"
          sparklineLabels={[months[0], months[months.length - 1]]}
          trendPct={pctTrend(kpis.series.collectionRatioPct)}
          trendLabel="vs start of period"
        />
        </div>
      </section>

      <section className="grid">
        <ChartCard
          title="Production"
          months={sortedMonths}
          datasets={[
            { label: "General", data: kpis.series.productionGeneral, color: "#3b82f6" },
            { label: "ORTHO", data: kpis.series.productionOrtho, color: "#a855f7" }
          ]}
          type="bar"
        />
        <ChartCard
          title="Collections"
          months={sortedMonths}
          datasets={[
            { label: "General", data: sortSeries(kpis.series.collectionsGeneral), color: "#22c55e" },
            { label: "ORTHO", data: sortSeries(kpis.series.collectionsOrtho), color: "#f59e0b" }
          ]}
          type="bar"
        />
        <ChartCard
          title="New Patients vs Goal"
          months={sortedMonths}
          datasets={[
            { label: "New Patients", data: sortSeries(kpis.series.newPatients), color: "#3b82f6" },
            { label: "Goal", data: sortSeries(kpis.series.newPatientGoal), color: "#cbd5e1" }
          ]}
          type="line"
        />
        <ChartCard
          title="Collection Ratio"
          months={sortedMonths}
          datasets={[
            { label: "Ratio %", data: sortSeries(kpis.series.collectionRatioPct), color: "#a855f7" }
          ]}
          type="line"
        />
      </section>

      <section className="panel tier-section">
        <div className="panel-title">Growth & Revenue Drivers</div>
        <div className="summary">
        <KpiCard variant="kpi" title="New Patients" value={Number(latestView.newPatients || 0)} subtitle="Last month" />
        <KpiCard variant="kpi" title="New Patient Goal" value={Number(latestView.newPatientGoal || 0)} subtitle="Monthly target" />
        <KpiCard variant="kpi" title="Lost Patients" value={Number(latestView.lostPatients || 0)} subtitle="Last month" />
        <KpiCard
          variant="kpi"
          title="Production — General"
          value={'$' + Number(latestView.productionGeneral || 0).toLocaleString()}
          subtitle="General production • Current month"
        />
        <KpiCard
          variant="kpi"
          title="Production — ORTHO"
          value={'$' + Number(latestView.productionOrtho || 0).toLocaleString()}
          subtitle="Ortho production • Current month"
        />
        <KpiCard
          variant="kpi"
          title="Collections — General"
          value={'$' + Number(latestView.collectionsGeneral || 0).toLocaleString()}
          subtitle="General collections • Current month"
        />
        <KpiCard
          variant="kpi"
          title="Collections — ORTHO"
          value={'$' + Number(latestView.collectionsOrtho || 0).toLocaleString()}
          subtitle="Ortho collections • Current month"
        />
        </div>
      </section>

      <section className="compact-panel tier-section">
        <div className="compact-head">
          <div className="compact-title">Operational Leakage</div>
          <div className="toggle" onClick={() => setShowLeakage(!showLeakage)}>{showLeakage ? "Hide details" : "Show details"}</div>
        </div>
        {showLeakage ? (
          <div className="summary">
            <KpiCard variant="kpi" title="Lost Production $" value={'$' + Number(latestView.lostProduction || 0).toLocaleString()} subtitle="Last month" />
            <KpiCard variant="kpi" title="Cancelled + No-Show" value={Number((latestView.cancelledAppointments || 0) + (latestView.noShowAppointments || 0))} subtitle="Total missed appts • Last month" />
            <KpiCard variant="kpi" title="Cancelled $" value={'$' + Number(latestView.lostCancelled || 0).toLocaleString()} subtitle="Last month" />
            <KpiCard variant="kpi" title="No-Show $" value={'$' + Number(latestView.lostNoShow || 0).toLocaleString()} subtitle="Last month" />
            <KpiCard variant="kpi" title="Cancellation Rate" value={`${Number(latestView.cancellationRatePct || 0)}%`} subtitle={`${Number(latestView.cancelledAppointments || 0)} of ${Number(latestView.scheduledAppointments || 0)} appts`} />
            <KpiCard variant="kpi" title="No-Show Rate" value={`${Number(latestView.noShowRatePct || 0)}%`} subtitle={`${Number(latestView.noShowAppointments || 0)} of ${Number(latestView.scheduledAppointments || 0)} appts`} />
            <KpiCard variant="kpi" title="Fill Rate" value={Number(latestView.fillRatePct || 0) + '%'} subtitle="Chairs utilized" />
          </div>
        ) : (
          <div className="compact-grid">
            <div className="chip">
              <div className="chip-title">Lost Production $</div>
              <div className="chip-value">{'$' + Number(latestView.lostProduction || 0).toLocaleString()}</div>
            </div>
            <div className="chip">
              <div className="chip-title">Cancelled + No-Show</div>
              <div className="chip-value">{Number((latestView.cancelledAppointments || 0) + (latestView.noShowAppointments || 0))}</div>
            </div>
            <div className="chip">
              <div className="chip-title">Cancellation Rate</div>
              <div className="chip-value">{Number(latestView.cancellationRatePct || 0) + '%'}</div>
            </div>
            <div className="chip">
              <div className="chip-title">No-Show Rate</div>
              <div className="chip-value">{Number(latestView.noShowRatePct || 0) + '%'}</div>
            </div>
            <div className="chip">
              <div className="chip-title">Cancelled $</div>
              <div className="chip-value">{'$' + Number(latestView.lostCancelled || 0).toLocaleString()}</div>
            </div>
            <div className="chip">
              <div className="chip-title">No-Show $</div>
              <div className="chip-value">{'$' + Number(latestView.lostNoShow || 0).toLocaleString()}</div>
            </div>
          </div>
        )}
      </section>

      <section className="compact-panel tier-section">
        <div className="compact-head">
          <div className="compact-title">Efficiency & Optimization</div>
          <div className="toggle" onClick={() => setShowOptimization(!showOptimization)}>{showOptimization ? "Hide details" : "Show details"}</div>
        </div>
        {showOptimization ? (
          <div className="summary">
            <KpiCard variant="kpi" title="Treatment Acceptance" value={Number(latestView.treatmentAcceptancePct || 0) + '%'} subtitle="Last month" />
          </div>
        ) : (
          <div className="compact-grid">
            <div className="chip">
              <div className="chip-title">Treatment Acceptance</div>
              <div className="chip-value">{Number(latestView.treatmentAcceptancePct || 0) + '%'}</div>
            </div>
          </div>
        )}
      </section>

      <section className="grid">
        <ChartCard
          title="Cancellation Rate"
          months={sortedMonths}
          datasets={[
            { label: "Cancelled %", data: sortSeries(kpis.series.cancellationRatePct), color: "#f59e0b" }
          ]}
          type="line"
        />
        <ChartCard
          title="No-Show Rate"
          months={sortedMonths}
          datasets={[
            { label: "No-Show %", data: sortSeries(kpis.series.noShowRatePct), color: "#3b82f6" }
          ]}
          type="line"
        />
        <ChartCard
          title="Net Patient Growth"
          months={sortedMonths}
          datasets={[
            { label: "Net", data: sortSeries(kpis.series.netPatientGrowth), color: "#22c55e" },
            { label: "Goal", data: sortSeries(kpis.series.newPatientGoal), color: "#cbd5e1" }
          ]}
          type="line"
        />
        <ChartCard
          title="Treatment Acceptance"
          months={sortedMonths}
          datasets={[
            { label: "Acceptance %", data: sortSeries(kpis.series.treatmentAcceptancePct), color: "#3b82f6" }
          ]}
          type="line"
        />
        <ChartCard
          title="Fill Rate"
          months={sortedMonths}
          datasets={[
            { label: "Fill Rate %", data: sortSeries(kpis.series.fillRatePct), color: "#22c55e" }
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
            {(aiInsights.length ? aiInsights : ((kpis.latest.aiInsights && kpis.latest.aiInsights.length) ? kpis.latest.aiInsights : mockInsights)).map((x, i) => {
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
            {(aiActions.length ? aiActions : ((kpis.latest.actionItems && kpis.latest.actionItems.length) ? kpis.latest.actionItems : mockActions)).map((x, i) => {
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

      {showUploadModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="panel" style={{ width: "400px", maxWidth: "90vw" }}>
            <div className="panel-head">
              <div className="panel-title">Upload Dental Data</div>
              <div style={{ cursor: "pointer" }} onClick={() => setShowUploadModal(false)}>✕</div>
            </div>
            <div style={{ padding: "20px 0" }}>
              <CsvUploader onData={handleCsvUpload} />
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div>Powered by MedRebel</div>
        <div>AI insights generated by Claude</div>
      </footer>
      </div>
    </div>
  )
}
