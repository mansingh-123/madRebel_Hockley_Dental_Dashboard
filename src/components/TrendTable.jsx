import React from "react"

export default function TrendTable({ rows }) {
  const months = rows.slice(-6)
  const now = new Date()
  const currentMonthName = months[months.length - 1]?.month
  return (
    <div className="card">
      <div className="card-title">6-Month Trend</div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>New Pts</th>
              <th>Net Growth</th>
              <th>Production</th>
              <th>Collections</th>
              <th>Collect %</th>
              <th>T. Accept</th>
            </tr>
          </thead>
          <tbody>
            {months.map((r, i) => {
              const collectPct = Math.round(((r.collections_general + r.collections_ortho) / ((r.production_general + r.production_ortho) || 1)) * 100)
              const net = (r.new_patients || 0) - (r.lost_patients || 0)
              const isCurrent = r.month === currentMonthName
              return (
                <tr key={i} className={isCurrent ? "row-current" : ""}>
                  <td>{r.month}</td>
                  <td>{r.new_patients}</td>
                  <td className={net >= 0 ? "pos" : "neg"}>{net >= 0 ? `+${net}` : net}</td>
                  <td>${(r.production_general + r.production_ortho).toLocaleString()}</td>
                  <td>${(r.collections_general + r.collections_ortho).toLocaleString()}</td>
                  <td>{collectPct}%</td>
                  <td>{Math.round(((r.treatment_accepted || 0) / ((r.treatment_proposed || 1))) * 100)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
