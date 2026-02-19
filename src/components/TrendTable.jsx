import React from "react"

export default function TrendTable({ rows }) {
  const months = rows.slice(-6)
  const now = new Date()
  const currentMonthName = months[months.length - 1]?.month

  const isValidNumber = (val) => typeof val === 'number' && !isNaN(val)

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
              const isCurrent = r.month === currentMonthName

              // New Patients
              const newPts = isValidNumber(r.new_patients) ? r.new_patients : null

              // Net Growth
              const newValid = isValidNumber(r.new_patients)
              const lostValid = isValidNumber(r.lost_patients)
              let netDisplay = '—'
              if (newValid && lostValid) {
                const net = r.new_patients - r.lost_patients
                netDisplay = net >= 0 ? `+${net}` : net
              }

              // Production total
              const prodGenValid = isValidNumber(r.production_general)
              const prodOrthValid = isValidNumber(r.production_ortho)
              let prodTotalDisplay = '—'
              if (prodGenValid && prodOrthValid) {
                prodTotalDisplay = `$${(r.production_general + r.production_ortho).toLocaleString()}`
              }

              // Collections total
              const collGenValid = isValidNumber(r.collections_general)
              const collOrthValid = isValidNumber(r.collections_ortho)
              let collTotalDisplay = '—'
              if (collGenValid && collOrthValid) {
                collTotalDisplay = `$${(r.collections_general + r.collections_ortho).toLocaleString()}`
              }

              // Collection %
              let collectPctDisplay = '—'
              if (prodGenValid && prodOrthValid && collGenValid && collOrthValid) {
                const prodTotal = r.production_general + r.production_ortho
                const collTotal = r.collections_general + r.collections_ortho
                if (prodTotal > 0) {
                  collectPctDisplay = `${Math.round((collTotal / prodTotal) * 100)}%`
                }
              }

              // Treatment Acceptance %
              const treatAccValid = isValidNumber(r.treatment_accepted)
              const treatPropValid = isValidNumber(r.treatment_proposed)
              let treatAcceptDisplay = '—'
              if (treatAccValid && treatPropValid && r.treatment_proposed > 0) {
                treatAcceptDisplay = `${Math.round((r.treatment_accepted / r.treatment_proposed) * 100)}%`
              }

              return (
                <tr key={i} className={isCurrent ? "row-current" : ""}>
                  <td>{r.month}</td>
                  <td>{newPts !== null ? newPts : '—'}</td>
                  <td className={newValid && lostValid ? (r.new_patients - r.lost_patients >= 0 ? "pos" : "neg") : ""}>
                    {netDisplay}
                  </td>
                  <td>{prodTotalDisplay}</td>
                  <td>{collTotalDisplay}</td>
                  <td>{collectPctDisplay}</td>
                  <td>{treatAcceptDisplay}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}