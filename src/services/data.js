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

export function buildApiUrl({ base, path, style, id, year, month }) {
  const isDev = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV
  const root = isDev ? "" : (base || "")
  
  // Use apiUrl helper to ensure full path in prod or dev proxy
  const endpoint = isDev ? path : `https://kpi.medrebel.io${path}`
  
  if (!id) return endpoint
  
  const params = new URLSearchParams()
  params.append("location_id", id)
  if (year) params.append("year", year)
  if (month) params.append("month", month)
  
  return `${endpoint}?${params.toString()}`
}

function apiUrl(p) {
  // const isDev = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV
  // return isDev ? p : `https://kpi.medrebel.io${p}`
  return `https://kpi.medrebel.io${p}`
}

export async function fetchLocationDetails(locationId) {
  try {
    const url = apiUrl(`/reports/location-details/?location_id=${encodeURIComponent(locationId)}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch location details")
    const json = await res.json()
    return json
  } catch (e) {
    console.error("Location Details Error:", e)
    return null
  }
}

export async function uploadDentalCsv(locationId, file) {
  try {
    const fd = new FormData()
    fd.append("location_id", locationId)
    fd.append("file", file)
    
    const url = apiUrl("/reports/upload/dental/")
    const res = await fetch(url, {
      method: "POST",
      body: fd
    })
    
    if (!res.ok) {
      const msg = `Upload failed (${res.status})`
      return { status: "error", message: msg }
    }
    return await res.json()
  } catch (e) {
    console.error("Upload Error:", e)
    return { status: "error", message: "Network error during upload" }
  }
}

export async function fetchPtData(locationId) {
  try {
    const fd = new FormData()
    fd.append("location_id", locationId)
    
    const url = apiUrl("/reports/pt/fetch/")
    const res = await fetch(url, {
      method: "POST",
      body: fd
    })
    
    if (!res.ok) {
      return { status: "error", message: `Fetch failed (${res.status})` }
    }
    return await res.json()
  } catch (e) {
    console.error("PT Fetch Error:", e)
    return { status: "error", message: "Network error during fetch" }
  }
}

export async function fetchPtDashboard(locationId) {
  try {
    const url = apiUrl(`/reports/pt/data/by-loc/?location_id=${encodeURIComponent(locationId)}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch PT data")
    return await res.json()
  } catch (e) {
    console.error("PT Dashboard Error:", e)
    return null
  }
}

export async function fetchMonthlyKpi(apiUrl) {
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error("Bad response")
  const json = await res.json()
  const arr = Array.isArray(json) ? json : (json.rows || json.data || [])
  return arr.map(normalizeRow)
}

export async function postLocationOnboard({ locationId, dashboard, source, sheetId }) {
  try {
    const fd = new FormData()
    const template = String(dashboard || "").toUpperCase()
    let dataSource = String(source || "").toUpperCase()
    if (template === "PT") {
      if (dataSource === "SHEET" || dataSource === "SHEET ID") dataSource = "GOOGLE_SHEET"
    }
    fd.append("location_id", String(locationId || ""))
    fd.append("dashboard", String(template || ""))
    fd.append("source", String(source || ""))
    fd.append("template", String(template || ""))
    fd.append("data_source", String(dataSource || ""))
    if (sheetId) fd.append("sheet_id", String(sheetId))
    
    const url = apiUrl("/reports/location-onboard/")
    console.log("POST Onboard:", url)
    const res = await fetch(url, {
      method: "POST",
      body: fd
    })
    if (!res.ok) {
      const msg = `Server error (${res.status})`
      return { status: "error", message: msg }
    }
    const json = await res.json().catch(() => ({}))
    return json
  } catch (e) {
    console.error("Onboard Error:", e)
    return { status: "error", message: "Network error or CORS blocked" }
  }
}

export async function generateAiInsights(locationId) {
  try {
    const fd = new FormData()
    fd.append("location_id", String(locationId || ""))
    const res = await fetch(apiUrl("/ai/generate-insights/"), {
      method: "POST",
      body: fd
    })
    if (!res.ok) {
      return { status: "error", message: `Server error (${res.status})` }
    }
    const json = await res.json().catch(() => ({}))
    return json
  } catch (e) {
    return { status: "error", message: "Network error or CORS blocked" }
  }
}


export async function fetchDentalMonthlyReport(locationId, year, month) {
  try {
    if (!locationId || !year || !month) {
      return {
        status: "error",
        message: "location_id, year and month are required"
      }
    }

    const url = apiUrl(
      `/reports/dental/data/by-month/?location_id=${encodeURIComponent(locationId)}&year=${year}&month=${month}`
    )

    const res = await fetch(url)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return {
        status: "error",
        message: json.message || `Server error (${res.status})`
      }
    }

    return await res.json()
  } catch (e) {
    console.error("Dental Monthly Report Error:", e)
    return {
      status: "error",
      message: "Network error or CORS blocked"
    }
  }
}

