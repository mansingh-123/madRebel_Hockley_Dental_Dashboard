import React from "react"

export default function CsvUploader({ onData }) {
  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/)
    const headers = lines[0].split(",").map(h => h.trim())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const row = {}
      headers.forEach((h, idx) => {
        row[h] = cols[idx]
      })
      rows.push(row)
    }
    return rows
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsv(reader.result)
      const normalized = rows.map(r => ({
        month: r.month,
        active_patients: Number(r.active_patients || 0),
        new_patients: Number(r.new_patients || 0),
        lost_patients: Number(r.lost_patients || 0),
        production_general: Number(r.production_general || 0),
        production_ortho: Number(r.production_ortho || 0),
        collections_general: Number(r.collections_general || 0),
        collections_ortho: Number(r.collections_ortho || 0),
        scheduled_appointments: Number(r.scheduled_appointments || 0),
        cancelled_appointments: Number(r.cancelled_appointments || 0),
        no_show_appointments: Number(r.no_show_appointments || 0),
        lost_production: Number(r.lost_production || 0),
        treatment_proposed: Number(r.treatment_proposed || 0),
        treatment_accepted: Number(r.treatment_accepted || 0)
      }))
      onData(normalized, file)
    }
    reader.readAsText(file)
  }

  return (
    <label className="upload">
      <input type="file" accept=".csv" onChange={handleFile} />
      <span>Upload CSV</span>
    </label>
  )
}
