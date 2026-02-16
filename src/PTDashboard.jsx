import React, { useState, useEffect } from "react"
import KpiCard from "./components/KpiCard.jsx"
import ErrorState from "./components/ErrorState.jsx"
import { fetchPtDashboard } from "./services/data.js"

export default function PTDashboard({ locationId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState("current")
  
  // Use dummy data if API returns nothing for now, or replace with API data
  const [rows, setRows] = useState(null)
  
  useEffect(() => {
    if (!locationId) return
    let alive = true
    setLoading(true)
    setError(false)
    fetchPtDashboard(locationId).then(res => {
      if (!alive) return
      if (res) setData(res)
    }).catch(() => {
      if (alive) setError(true)
    }).finally(() => {
      if (alive) setLoading(false)
    })
    return () => { alive = false }
  }, [locationId])

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
  
  const months = ["Dec 12", "Dec 19", "Dec 26", "Jan 2", "Jan 9", "Jan 16"]
  const activePts = [360, 375, 382, 389, 396, 398]
  const weeklyVisits = [620, 612, 605, 598, 590, 610]
  const weeklyReferrals = [36, 32, 28, 33, 41, 40]
  const sched = [134, 152, 138, 138, 86]
  const comp = [122, 141, 127, 126, 80]
  
  // TODO: Once API is real, map `data` to these variables
  
  function trend(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return 0
    const first = arr[0]
    const last = arr[arr.length - 1]
    if (!first) return 0
    return ((last - first) / first) * 100
  }

  function weekOfLabel() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const ms = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    return `Week of ${ms[monday.getMonth()]} ${String(monday.getDate()).padStart(2,"0")}, ${monday.getFullYear()}`
  }

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
            value={Number(activePts[activePts.length - 1])}
            subtitle="All 5 locations • YTD Avg: 389"
            sparkline={activePts}
            lineColor="#22c55e"
            sparklineLabels={["Week ending 12/12", "Week ending 1/16"]}
            trendPct={trend(activePts)}
            trendLabel="vs 6 wks ago"
          />
          <KpiCard
            variant="metric"
            title="Weekly Visits"
            value={Number(weeklyVisits[weeklyVisits.length - 1])}
            subtitle="Combined • YTD Avg: 598"
            sparkline={weeklyVisits}
            lineColor="#3b82f6"
            sparklineLabels={["Week ending 12/12", "Week ending 1/16"]}
            trendPct={trend(weeklyVisits)}
            trendLabel="vs 6 wks ago"
          />
          <KpiCard
            variant="metric"
            title="Weekly Referrals"
            value={Number(weeklyReferrals[weeklyReferrals.length - 1])}
            subtitle="All clinics • YTD Avg: 37"
            sparkline={weeklyReferrals}
            lineColor="#a855f7"
            sparklineLabels={["Week ending 12/12", "Week ending 1/16"]}
            trendPct={trend(weeklyReferrals)}
            trendLabel="vs 6 wks ago"
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
                  <th>Location</th>
                  <th>Monday</th>
                  <th>Tuesday</th>
                  <th>Wednesday</th>
                  <th>Thursday</th>
                  <th>Friday</th>
                  <th>Weekly</th>
                  <th>Cancel %</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Katy", weekly: 167, cancel: 6.2, days: [[38,35],[42,40],[36,34],[40,37],[22,21]], dot:"#9333ea" },
                  { name: "Bellaire", weekly: 127, cancel: 6.6, days: [[28,26],[32,30],[30,28],[28,26],[18,17]], dot:"#3b82f6" },
                  { name: "Sugar Land", weekly: 132, cancel: 9.6, days: [[30,27],[34,31],[32,29],[30,27],[20,18]], dot:"#ef4444" },
                  { name: "I-45", weekly: 109, cancel: 7.6, days: [[24,22],[28,26],[26,24],[24,22],[16,15]], dot:"#22c55e" },
                  { name: "Webster", weekly: 61, cancel: 12.9, days: [[14,12],[16,14],[14,12],[16,14],[10,9]], dot:"#f59e0b" }
                ].map((row, i) => {
                  const cancelClass = row.cancel < 8 ? "cancel-good" : row.cancel <= 10 ? "cancel-warn" : "cancel-bad"
                  return (
                    <tr key={i}>
                      <td className="location-cell"><span className="dot" style={{background:row.dot}}></span> {row.name}</td>
                      {row.days.map((d, j) => (
                        <td key={j}><div className="sched">Sch {d[0]}</div><div className="comp">Cmp {d[1]}</div></td>
                      ))}
                      <td>{row.weekly}</td>
                      <td className={cancelClass}>{row.cancel}%</td>
                    </tr>
                  )
                })}
                <tr className="row-total">
                  <td>Total</td>
                  <td>Sch {sched[0]} • Cmp {comp[0]}</td>
                  <td>Sch {sched[1]} • Cmp {comp[1]}</td>
                  <td>Sch {sched[2]} • Cmp {comp[2]}</td>
                  <td>Sch {sched[3]} • Cmp {comp[3]}</td>
                  <td>Sch {sched[4]} • Cmp {comp[4]}</td>
                  <td>{sched.reduce((a,b)=>a+b,0)}</td>
                  <td>8.0%</td>
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
                  <th>6-Wk Trend</th>
                  <th>vs LY</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name:"Katy", pts:103, avg:161, color:"#9333ea", ly:"+12%" },
                  { name:"Bellaire", pts:96, avg:124, color:"#3b82f6", ly:"+8%" },
                  { name:"Sugar Land", pts:82, avg:133, color:"#ef4444", ly:"+18%" },
                  { name:"I-45", pts:62, avg:111, color:"#22c55e", ly:"-5%" },
                  { name:"Webster", pts:29, avg:61, color:"#f59e0b", ly:"-3%" }
                ].map((row, i) => {
                  const lyNum = parseFloat(row.ly)
                  const lyClass = isNaN(lyNum) ? "trend-neutral" : (lyNum > 0 ? "trend-up" : (lyNum < 0 ? "trend-down" : "trend-neutral"))
                  const points = [0,0,0,0,0,0].map((_, idx) => {
                    const x = (idx / 5) * 120
                    const y = 12 + Math.sin(idx) * 4
                    return `${idx === 0 ? "M" : "L"} ${x} ${y}`
                  }).join(" ")
                  return (
                    <tr key={i}>
                      <td><span className={`loc-dot ${row.name==="Katy"?"loc-katy":row.name==="Bellaire"?"loc-bellaire":row.name==="Sugar Land"?"loc-sugar":row.name==="I-45"?"loc-i45":"loc-webster"}`}></span>{row.name}</td>
                      <td><strong>{row.pts}</strong></td>
                      <td>{row.avg}</td>
                      <td>
                        <svg className="mini-trend" viewBox="0 0 120 24" preserveAspectRatio="none">
                          <path d={points} fill="none" stroke={row.color} strokeWidth="2" />
                          {[0,1,2,3,4,5].map((j) => {
                            const x = (j / 5) * 120
                            const y = 12 + Math.sin(j) * 4
                            return <circle key={j} cx={x} cy={y} r="2.2" fill={row.color} />
                          })}
                        </svg>
                      </td>
                      <td className={lyClass}>{row.ly}</td>
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
            {[
              { name:"Katy", ytd:18, trend:+15, color:"#9333ea", last:"506" },
              { name:"Bellaire", ytd:14, trend:+8, color:"#3b82f6", last:"473" },
              { name:"Sugar Land", ytd:9, trend:-12, color:"#ef4444", last:"386" },
              { name:"I-45", ytd:10, trend:0, color:"#22c55e", last:"376" },
              { name:"Webster", ytd:7, trend:+22, color:"#f59e0b", last:"239" }
            ].map((c, i) => {
              const tClass = c.trend > 0 ? "up" : c.trend < 0 ? "down" : ""
              const pts = [0,1,2,3,4,5,6,7,8].map((j) => {
                const x = (j / 8) * 100
                const y = 24 + Math.sin(j) * 4
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
                      {[0,1,2,3,4,5,6,7,8].map((j) => {
                        const x = (j / 8) * 100
                        const y = 24 + Math.sin(j) * 4
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
                {[
                  { name:"Dr. Tran", last:135, ytd:18, pace:"11.3/mo", jan:18, status:"+59% Ahead", type:"ahead" },
                  { name:"Dr. Nair (SL)", last:74, ytd:6, pace:"6.2/mo", jan:6, status:"On Track", type:"ontrack" },
                  { name:"Dr. Awan", last:62, ytd:3, pace:"5.2/mo", jan:3, status:"-42% Behind", type:"behind" },
                  { name:"Dr. Doerr", last:50, ytd:5, pace:"4.2/mo", jan:5, status:"+20% Ahead", type:"ahead" },
                  { name:"Dr. Kopas", last:49, ytd:4, pace:"4.1/mo", jan:4, status:"On Track", type:"ontrack" },
                  { name:"Dr. Shah (SL)", last:46, ytd:3, pace:"3.8/mo", jan:3, status:"-21% Behind", type:"behind" },
                  { name:"Dr. Hussain", last:43, ytd:3, pace:"3.6/mo", jan:3, status:"-17% Behind", type:"behind" },
                  { name:"Dr. Desai (SL)", last:43, ytd:2, pace:"3.6/mo", jan:2, status:"-44% Behind", type:"behind" },
                  { name:"Dr. Gidvani", last:41, ytd:6, pace:"3.4/mo", jan:6, status:"+76% Ahead", type:"ahead" },
                  { name:"Dr. Scoon", last:40, ytd:5, pace:"3.3/mo", jan:5, status:"+50% Ahead", type:"ahead" }
                ].map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.last}</td>
                    <td><strong>{r.ytd}</strong></td>
                    <td>{r.pace}</td>
                    <td>{r.jan}</td>
                    <td>
                      <span className={`status-badge ${r.type === "ahead" ? "status-ahead" : r.type === "ontrack" ? "status-ontrack" : "status-behind"}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="help">2026 YTD through week of Jan 12–16. Pace based on maintaining 2025 volume.</div>
        </section>

        <section className="ai-dashboard">
          <div className="ai-dashboard-head">
            <div>AI Insights</div>
            <div className="ai-live"><span className="status-dot"></span>Live</div>
          </div>
          <div className="help">Powered by Claude • Week of {weekOfLabel().split('Week of ')[1]}</div>
          <div className="ai-tiles">
            <div className="ai-tile">Webster cancellation rate at 12.9%. Above 10% threshold. Consider reminder call protocol or investigate scheduling issues.</div>
            <div className="ai-tile">Sugar Land showing strongest growth. +18% weekly visits YoY. High conversion rate suggests strong patient retention.</div>
            <div className="ai-tile">4 top referrers need outreach. Dr. Desai, Awan, Shah, Hussain all showing 17–44% decline. Focus on Sugar Land.</div>
            <div className="ai-tile">Q4 collections up 5.2% YoY. $972K total, +$72K net vs Q4 2024. Q1 2026 data pending.</div>
          </div>
          <div className="ai-next">Next analysis: Monday, Jan 26, 2026</div>
        </section>

        <section className="collections">
          <div className="collections-title">Collections: Quarterly Summary</div>
          <div className="help">Q4 2025 vs Q4 2024</div>
          <div className="collections-grid">
            <div className="collection-card">
              <div className="month">October</div>
              <div className="value">$356K</div>
            </div>
            <div className="collection-card">
              <div className="month">November</div>
              <div className="value">$318K</div>
            </div>
            <div className="collection-card">
              <div className="month">December</div>
              <div className="value">$297K</div>
            </div>
            <div className="collection-card collection-total">
              <div className="month">Q4 Total</div>
              <div className="value">$972K</div>
              <div className="delta">+5.2% vs Q4 2024</div>
            </div>
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
