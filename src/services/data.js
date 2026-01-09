function toNumber(v) {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function normalizeRow(r) {
  return {
    month: r.month,
    active_patients: toNumber(r.active_patients),
    new_patients: toNumber(r.new_patients),
    lost_patients: toNumber(r.lost_patients),
    production_general: toNumber(r.production_general),
    production_ortho: toNumber(r.production_ortho),
    collections_general: toNumber(r.collections_general),
    collections_ortho: toNumber(r.collections_ortho),
    scheduled_appointments: toNumber(r.scheduled_appointments),
    cancelled_appointments: toNumber(r.cancelled_appointments),
    no_show_appointments: toNumber(r.no_show_appointments),
    lost_production: toNumber(r.lost_production),
    treatment_proposed: toNumber(r.treatment_proposed),
    treatment_accepted: toNumber(r.treatment_accepted)
  }
}

export function buildApiUrl({ base, path, style, id }) {
  if (!base) return ""
  if (!id) return base + path
  if (style === "path") return `${base}${path}/id:${encodeURIComponent(id)}`
  return `${base}${path}?id=${encodeURIComponent(id)}`
}

export async function fetchMonthlyKpi(apiUrl) {
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error("Bad response")
  const json = await res.json()
  const arr = Array.isArray(json) ? json : (json.rows || json.data || [])
  return arr.map(normalizeRow)
}
