import React, { useState, useEffect } from "react"
import KpiCard from "./components/KpiCard.jsx"
import ErrorState from "./components/ErrorState.jsx"
import AiInsights from "./components/AiInsights.jsx"
import { fetchPtDashboard, generateAiInsights } from "./services/data.js"

export default function PTDashboard({ locationId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const [aiData, setAiData] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  
  useEffect(() => {
    if (!locationId) return
    let alive = true
    setLoading(true)
    setError(false)
    fetchPtDashboard(locationId).then(res => {
      if (!alive) return
      if (res && res.data) setData(res.data)
      else if (res) setData(res)
    }).catch(() => {
      if (alive) setError(true)
    }).finally(() => {
      if (alive) setLoading(false)
    })
    
    // Fetch AI Insights independently
    setAiLoading(true)
    setAiError(null)
    generateAiInsights(locationId).then(res => {
      if (!alive) return
      if (res.status === "success" && res.ai_response) {
        setAiData(res.ai_response)
      } else {
        setAiError(res.message || "Failed to generate insights")
      }
    }).catch(err => {
      if (alive) setAiError("Network error connecting to AI service")
    }).finally(() => {
      if (alive) setAiLoading(false)
    })

    return () => { alive = false }
  }, [locationId])

  const getQuarterMonths = (q) => {
    switch(q) {
      case "Q1": return ["January", "February", "March"]
      case "Q2": return ["April", "May", "June"]
      case "Q3": return ["July", "August", "September"]
      case "Q4": return ["October", "November", "December"]
      default: return ["Month 1", "Month 2", "Month 3"]
    }
  }

  const getQuarterKeys = (q) => {
    switch(q) {
      case "Q1": return ["jan", "feb", "mar"]
      case "Q2": return ["apr", "may", "jun"]
      case "Q3": return ["jul", "aug", "sep"]
      case "Q4": return ["oct", "nov", "dec"]
      default: return ["m1", "m2", "m3"]
    }
  }

  if (error) {
    return (
      <div className="page pt">
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
  
  // Data Mapping
  const wm = data?.weekly_metrics
  const activePts = wm?.trends?.active_patients || []
  const weeklyVisits = wm?.trends?.weekly_visits || []
  const weeklyReferrals = wm?.trends?.weekly_referrals || []
  
  // Calculate Averages for "YTD Avg" simulation (using available trend data)
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0
  const activeAvg = avg(activePts)
  const visitAvg = avg(weeklyVisits)
  const refAvg = avg(weeklyReferrals)

  // Calculate trends for summary cards (compare last week to previous week, or last data point to first)
  const activeTrend = activePts.length >= 2 ? ((activePts[activePts.length-1] - activePts[activePts.length-2])/activePts[activePts.length-2])*100 : 0
  const visitTrend = weeklyVisits.length >= 2 ? ((weeklyVisits[weeklyVisits.length-1] - weeklyVisits[weeklyVisits.length-2])/weeklyVisits[weeklyVisits.length-2])*100 : 0
  const refTrend = weeklyReferrals.length >= 2 ? ((weeklyReferrals[weeklyReferrals.length-1] - weeklyReferrals[weeklyReferrals.length-2])/weeklyReferrals[weeklyReferrals.length-2])*100 : 0

  // Labels
  const formatDate = (dateStr) => {
    if (!dateStr) return "Current"
    const d = new Date(dateStr)
    return `${d.getMonth()+1}/${d.getDate()}`
  }
  const currentEnd = wm?.current?.week_ending
  const sparkLabels = currentEnd ? ["", `Week ending ${formatDate(currentEnd)}`] : ["", ""]

  function trend(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return 0
    const first = arr[0]
    const last = arr[arr.length - 1]
    if (!first) return 0
    return ((last - first) / first) * 100
  }

  function weekOfLabel() {
    if (wm?.current?.week_ending) {
        const d = new Date(wm.current.week_ending)
        const ms = ["January","February","March","April","May","June","July","August","September","October","November","December"]
        return `Week of ${ms[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`
    }
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const ms = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    return `Week of ${ms[monday.getMonth()]} ${String(monday.getDate()).padStart(2,"0")}, ${monday.getFullYear()}`
  }

  // Derived Data
  const visitLocations = data?.weekly_visits?.locations || []
  const totalSched = [0,0,0,0,0]
  const totalComp = [0,0,0,0,0]
  visitLocations.forEach(loc => {
    ["Mon","Tue","Wed","Thu","Fri"].forEach((day, idx) => {
    if (loc[day]) {
        totalSched[idx] += (loc[day].scheduled || 0)
        totalComp[idx] += (loc[day].completed || 0)
    }
    })
  })
  const grandTotal = totalSched.reduce((a,b)=>a+b,0)
  
  const perfLocations = data?.location_6week?.locations || []

  const clinics = ["Katy", "Bellaire", "Sugar Land", "I-45", "Webster"]
  // If we have API data, dynamically build the clinic list from referrals_clinic
  // Otherwise default to the fixed list
  const clinicList = data?.referrals_clinic?.length 
    ? [...new Set(data.referrals_clinic.map(r => r.clinic))]
    : clinics

  const referralCards = clinicList.map(clinicName => {
    // Try to find 2026 (current year) data in referrals_clinic first
    const ref2026 = data?.referrals_clinic?.find(r => r.clinic === clinicName && r.year === 2026)
    // Fallback to summing the referrer list if 2026 clinic total is missing
    const ytd2026 = ref2026?.total ?? (data?.referrers?.filter(r => r.clinic === clinicName).reduce((sum, r) => sum + r.referral_count, 0) || 0)
    
    const ref2025 = data?.referrals_clinic?.find(r => r.clinic === clinicName && r.year === 2025)
    const total2025 = ref2025?.total || 0
    const avg2025 = total2025 / 12
    const trendPct = avg2025 ? Math.round(((ytd2026 - avg2025) / avg2025) * 100) : 0
    // Monthly keys: jan, feb, mar...
    const monthKeys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
    const monthlyData = ref2025?.monthly ? monthKeys.map(k => ref2025.monthly[k] || 0) : []
    
    // Assign colors cyclically
    const colors = ["#9333ea", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#6366f1"]
    const colorIndex = clinicList.indexOf(clinicName) % colors.length
    
    return {
      name: clinicName,
      ytd: ytd2026,
      trend: trendPct,
      color: colors[colorIndex],
      last: total2025,
      sparkline: monthlyData
    }
  })

  const referrerRows = data?.referrers || []
  const collectionData = data?.collections?.[0]

  return (
    <div className="page pt">
      <div className="container">
        <header className="header">
          <div className="brand">PT Dashboard</div>
          <div className="controls">
            <span><span className="status-dot"></span>{loading ? "Loading..." : "Live Data"}</span>
          </div>
        </header>

        <section className="summary">
          <KpiCard
            variant="metric"
            title="Active Patients"
            value={Number(activePts[activePts.length - 1] || 0)}
            subtitle={`All 5 locations • Avg: ${activeAvg}`}
            sparkline={activePts}
            lineColor="#22c55e"
            sparklineLabels={sparkLabels}
            trendPct={activeTrend}
            trendLabel="vs last week"
          />
          <KpiCard
            variant="metric"
            title="Weekly Visits"
            value={Number(weeklyVisits[weeklyVisits.length - 1] || 0)}
            subtitle={`Combined • Avg: ${visitAvg}`}
            sparkline={weeklyVisits}
            lineColor="#3b82f6"
            sparklineLabels={sparkLabels}
            trendPct={visitTrend}
            trendLabel="vs last week"
          />
          <KpiCard
            variant="metric"
            title="Weekly Referrals"
            value={Number(weeklyReferrals[weeklyReferrals.length - 1] || 0)}
            subtitle={`All clinics • Avg: ${refAvg}`}
            sparkline={weeklyReferrals}
            lineColor="#a855f7"
            sparklineLabels={sparkLabels}
            trendPct={refTrend}
            trendLabel="vs last week"
          />
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">Weekly Visit Tracker</div>
            <div className="legend">
              <span className="legend-item"><span className="legend-dot scheduled"></span>Scheduled</span>
              <span className="legend-item"><span className="legend-dot completed"></span>Completed</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table weekly-tracker">
              <thead>
                <tr>
                  <th rowSpan="2">Location</th>
                  <th colSpan="2">Monday</th>
                  <th colSpan="2">Tuesday</th>
                  <th colSpan="2">Wednesday</th>
                  <th colSpan="2">Thursday</th>
                  <th colSpan="2">Friday</th>
                  <th colSpan="2">Weekly Total</th>
                  <th rowSpan="2">Cancel %</th>
                </tr>
                <tr className="sub-header">
                  <th>Sch</th><th>Cmp</th>
                  <th>Sch</th><th>Cmp</th>
                  <th>Sch</th><th>Cmp</th>
                  <th>Sch</th><th>Cmp</th>
                  <th>Sch</th><th>Cmp</th>
                  <th>Sch</th><th>Cmp</th>
                </tr>
              </thead>
              <tbody>
                {visitLocations.map((row, i) => {
                  const cancelClass = row.cancel_percentage < 8 ? "cancel-good" : row.cancel_percentage <= 10 ? "cancel-warn" : "cancel-bad"
                  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
                  const dotColor = row.location==="Katy"?"#9333ea":row.location==="Bellaire"?"#3b82f6":row.location==="Sugar Land"?"#ef4444":row.location==="I-45"?"#22c55e":"#f59e0b"
                  return (
                    <tr key={i}>
                      <td className="location-cell"><span className="dot" style={{background:dotColor}}></span> {row.location}</td>
                      {days.map((d, j) => (
                        <React.Fragment key={j}>
                          <td>{row[d]?.scheduled||0}</td>
                          <td>{row[d]?.completed||0}</td>
                        </React.Fragment>
                      ))}
                      <td style={{fontWeight:600}}>{row.Total?.scheduled||0}</td>
                      <td style={{fontWeight:600}}>{row.Total?.completed||0}</td>
                      <td className={cancelClass}>{row.cancel_percentage}%</td>
                    </tr>
                  )
                })}
                <tr className="row-total">
                  <td>Total</td>
                  <td>{totalSched[0]}</td><td>{totalComp[0]}</td>
                  <td>{totalSched[1]}</td><td>{totalComp[1]}</td>
                  <td>{totalSched[2]}</td><td>{totalComp[2]}</td>
                  <td>{totalSched[3]}</td><td>{totalComp[3]}</td>
                  <td>{totalSched[4]}</td><td>{totalComp[4]}</td>
                  <td>{totalSched.reduce((a,b)=>a+b,0)}</td>
                  <td>{grandTotal > 0 ? (totalComp.reduce((a,b)=>a+b,0)) : 0}</td>
                  <td>{grandTotal > 0 ? ((1 - (totalComp.reduce((a,b)=>a+b,0) / grandTotal)) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="help">Target: &lt;8% cancellation rate • <span style={{color:"#10B981"}}>&lt;8%</span> • <span style={{color:"#F59E0B"}}>8–10%</span> • <span style={{color:"#EF4444"}}>&gt;10%</span></div>
        </section>


        <section className="panel-lg">
          <div className="panel-title">6-Week Performance by Location</div>
          <div className="help">Active Patients & Weekly Visit Averages • vs LY = Same 6-Week Period Last Year</div>
          <div className="table-wrap">
            <table className="table-performance">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Active Pts</th>
                  <th>Wkly Avg</th>
                  <th>vs LY</th>
                </tr>
              </thead>
              <tbody>
                {perfLocations.map((row, i) => {
                  const lyNum = parseFloat(row.vs_ly_pct)
                  const lyClass = isNaN(lyNum) ? "trend-neutral" : (lyNum > 0 ? "trend-up" : (lyNum < 0 ? "trend-down" : "trend-neutral"))
                  return (
                    <tr key={i}>
                      <td><span className={`loc-dot ${row.location==="Katy"?"loc-katy":row.location==="Bellaire"?"loc-bellaire":row.location==="Sugar Land"?"loc-sugar":row.location==="I-45"?"loc-i45":"loc-webster"}`}></span>{row.location}</td>
                      <td><strong>{row.active_patients}</strong></td>
                      <td>{row.weekly_visits}</td>
                      <td className={lyClass}>{row.vs_ly_pct > 0 ? "+" : ""}{row.vs_ly_pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel-lg">
          <div className="panel-head">
            <div className="panel-title">Referrals by Clinic</div>
            <div className="ref-legend">
              <span><span className="year-dot year-2025"></span>2025</span>
              <span><span className="year-dot year-2026"></span>2026</span>
            </div>
          </div>
          <div className="referral-cards">
            {referralCards.map((c, i) => {
              const tClass = c.trend > 0 ? "up" : c.trend < 0 ? "down" : ""
              // Use monthly data for sparkline if available, otherwise default points
              const sparkPoints = c.sparkline.length > 0 ? c.sparkline : [0,0,0,0,0,0,0,0,0,0,0,0]
              const maxVal = Math.max(...sparkPoints, 1)
              const pts = sparkPoints.map((val, j) => {
                const x = (j / (sparkPoints.length - 1)) * 100
                const y = 48 - ((val / maxVal) * 40)
                return `${j === 0 ? "M" : "L"} ${x} ${y}`
              }).join(" ")
              
              return (
                <div className="ref-card" key={i}>
                  <div className="ref-head">
                    <div className="ref-name">{c.name}</div>
                    <div className={`ref-trend ${tClass}`}>{(c.trend>0?"+":"") + c.trend + "%"}</div>
                  </div>
                  <div className="ref-ytd">{c.ytd} <span className="ref-caption">2026 YTD</span></div>
                  <div className="ref-spark">
                    <svg viewBox="0 0 100 48" preserveAspectRatio="none" width="100%" height="48">
                      <path d={pts} fill="none" stroke={c.color} strokeWidth="2" />
                      {sparkPoints.map((val, j) => {
                         const x = (j / (sparkPoints.length - 1)) * 100
                         const y = 48 - ((val / maxVal) * 40)
                         return <circle key={j} cx={x} cy={y} r="2" fill={c.color} />
                      })}
                    </svg>
                  </div>
                  <div className="ref-caption">2025 total: {c.last}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel-lg">
          <div className="panel-head">
            <div className="panel-title">Top Referrer Pace Tracker</div>
            <div className="legend">
              <span className="status-badge status-ahead">Ahead</span>
              <span className="status-badge status-ontrack">On Track (±10%)</span>
              <span className="status-badge status-behind">Behind</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="pace-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>2025 Total</th>
                  <th>2026 YTD</th>
                  <th>Monthly Pace Needed</th>
                  <th>Jan Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrerRows.map((row, i) => {
                  const statusClass = row.pace_status === "ahead" ? "status-ahead" : row.pace_status === "on_track" ? "status-ontrack" : "status-behind"
                  const statusText = row.pace_status === "ahead" ? "Ahead" : row.pace_status === "on_track" ? "On Track" : "Behind"
                  return (
                    <tr key={i}>
                      <td><div className="doc-name">{row.referrer_name}</div><div className="doc-clinic">{row.clinic}</div></td>
                      <td>{row.total_2025}</td>
                      <td>{row.referral_count}</td>
                      <td>{row.avg_monthly_2025}/mo</td>
                      <td><strong>{row.referral_count}</strong></td>
                      <td><span className={`status-badge ${statusClass}`}>{statusText}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="help">2026 YTD through {sparkLabels[1].replace("Week ending ", "") || "Current"}. Pace based on maintaining 2025 volume.</div>
        </section>

        <AiInsights data={aiData} loading={aiLoading} error={aiError} />

        <section className="collections">
          <div className="collections-title">Collections: Quarterly Summary</div>
          {collectionData ? (
             (() => {
               const months = getQuarterMonths(collectionData.quarter)
               const keys = getQuarterKeys(collectionData.quarter)
               return (
                 <>
                   <div className="help">{collectionData.quarter} {collectionData.year} vs Prior Year</div>
                   <div className="collections-grid">
                     <div className="collection-card">
                       <div className="month">{months[0]}</div>
                       <div className="value">${((collectionData[keys[0]] || 0) / 1000).toFixed(0)}K</div>
                     </div>
                     <div className="collection-card">
                       <div className="month">{months[1]}</div>
                       <div className="value">${((collectionData[keys[1]] || 0) / 1000).toFixed(0)}K</div>
                     </div>
                     <div className="collection-card">
                       <div className="month">{months[2]}</div>
                       <div className="value">${((collectionData[keys[2]] || 0) / 1000).toFixed(0)}K</div>
                     </div>
                     <div className="collection-card collection-total">
                       <div className="month">{collectionData.quarter} Total</div>
                       <div className="value">${(collectionData.total / 1000).toFixed(0)}K</div>
                       <div className="delta">{collectionData.vs_prior_year_pct > 0 ? "+" : ""}{collectionData.vs_prior_year_pct}% vs Prior Year</div>
                     </div>
                   </div>
                 </>
               )
             })()
          ) : (
            <div className="help">No collections data available</div>
          )}
        </section>

        <footer className="footer">
          <div>Powered by MedRebel</div>
          <div>AI insights generated by Claude</div>
        </footer>
      </div>
    </div>
  )
}
