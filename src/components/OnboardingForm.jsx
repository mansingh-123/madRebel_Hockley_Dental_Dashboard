import React from "react"
import CsvUploader from "./CsvUploader.jsx"
import { uploadDentalCsv, fetchPtData } from "../services/data.js"

export default function OnboardingForm({ locationId, onSubmit, onComplete }) {
  const [loc, setLoc] = React.useState(String(locationId || ""))
  const [dashboard, setDashboard] = React.useState("")
  const [source, setSource] = React.useState("")
  const [sheetId, setSheetId] = React.useState("")
  const [error, setError] = React.useState("")
  const [ingestionMode, setIngestionMode] = React.useState(false)
  const [ingestionMsg, setIngestionMsg] = React.useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    if (!loc.trim()) { setError("Enter location ID"); return }
    if (!dashboard) { setError("Select dashboard type"); return }
    if (!source) { setError("Select data source"); return }
    if (dashboard === "PT" && source === "Sheet" && !sheetId.trim()) { setError("Enter Sheet ID"); return }
    setError("")
    
    const res = await Promise.resolve(onSubmit({ locationId: loc.trim(), dashboard, source, sheetId: sheetId.trim() || undefined }))
    if (!res || res.status !== "success") {
      setError((res && res.message) ? res.message : "Onboarding failed. Please try again.")
      return
    }
    
    // On success, move to data ingestion
    setIngestionMode(true)
    // If PT + Sheet, trigger fetch immediately
    if (String(dashboard).toUpperCase() === "PT" && (source === "Sheet" || source === "GOOGLE_SHEET")) {
      handlePtFetch()
    }
  }
  
  async function handlePtFetch() {
    setIngestionMsg("Fetching data from Google Sheet...")
    const res = await fetchPtData(loc.trim())
    if (res && res.status === "error") {
      setError(res.message)
      setIngestionMsg("")
    } else {
      setIngestionMsg("Data fetched successfully!")
      setTimeout(() => {
        onComplete()
      }, 1000)
    }
  }
  
  async function handleCsvUpload(rows, file) {
    setIngestionMsg("Uploading CSV...")
    const res = await uploadDentalCsv(loc.trim(), file)
    if (res && res.status === "error") {
      setError(res.message)
      setIngestionMsg("")
    } else {
      setIngestionMsg("CSV uploaded successfully!")
      setTimeout(() => {
        onComplete()
      }, 1000)
    }
  }

  const isDental = dashboard === "DENTAL"
  const isPt = dashboard === "PT"
  const showCsv = isDental && source === "CSV"
  const showSheetId = isPt && source === "Sheet"
  const showApiSoon = source === "API"
  
  if (ingestionMode) {
    if (isPt) {
      return (
        <div className="panel panel-form">
           <div className="form-hero">
            <div className="hero-title">Setting up PT Dashboard</div>
            <div className="hero-sub">{ingestionMsg || "Initializing..."}</div>
          </div>
          {error && <div className="form-error" style={{margin: 20}}>{error}</div>}
        </div>
      )
    }
    // Dental CSV Ingestion
    return (
      <div className="panel panel-form">
        <div className="form-hero">
          <div className="hero-title">Upload Dental Data</div>
          <div className="hero-sub">Upload your CSV to populate the dashboard</div>
        </div>
        <div className="form" style={{padding: 20}}>
          {ingestionMsg ? (
             <div className="hero-meta"><span className="badge success">{ingestionMsg}</span></div>
          ) : (
            <div className="form-row">
              <label>CSV File</label>
              <CsvUploader onData={handleCsvUpload} />
            </div>
          )}
        </div>
        {error && <div className="form-error" style={{margin: 20}}>{error}</div>}
      </div>
    )
  }

  return (
    <div className="panel panel-form">
      <div className="form-hero">
        <div className="hero-title">Onboarding</div>
        <div className="hero-sub">Choose dashboard type and data source</div>
        <div className="hero-meta">
          <span className="badge">Location ID: {loc || "—"}</span>
          <span className="badge">Required fields</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-row">
            <label>Location ID</label>
            <input
              type="text"
              className="input"
              placeholder="Enter location identifier"
              value={loc}
              onChange={e => setLoc(e.target.value)}
            />
            <div className="help">Example: KATY, BELLAIRE, WEBSTER</div>
          </div>
          <div className="form-row">
            <label>Dashboard Type</label>
            <div className="choices">
              <label className="choice">
                <input
                  type="radio"
                  name="dashboard"
                  value="DENTAL"
                  checked={dashboard === "DENTAL"}
                  onChange={() => {
                    setDashboard("DENTAL")
                    setSource("")
                  }}
                />
                <span>DENTAL</span>
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="dashboard"
                  value="PT"
                  checked={dashboard === "PT"}
                  onChange={() => {
                    setDashboard("PT")
                    setSource("")
                  }}
                />
                <span>PT</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <label>Data Source</label>
            <div className="choices">
              {isDental && (
                <>
                  <label className="choice">
                    <input
                      type="radio"
                      name="source"
                      value="CSV"
                      checked={source === "CSV"}
                      onChange={() => setSource("CSV")}
                      disabled={!dashboard}
                    />
                    <span>CSV</span>
                  </label>
                  <label className="choice">
                    <input
                      type="radio"
                      name="source"
                      value="API"
                      checked={source === "API"}
                      onChange={() => setSource("API")}
                      disabled={!dashboard}
                    />
                    <span>API</span>
                  </label>
                </>
              )}
              {isPt && (
                <>
                  <label className="choice">
                    <input
                      type="radio"
                      name="source"
                      value="Sheet"
                      checked={source === "Sheet"}
                      onChange={() => setSource("Sheet")}
                      disabled={!dashboard}
                    />
                    <span>Sheet ID</span>
                  </label>
                  <label className="choice">
                    <input
                      type="radio"
                      name="source"
                      value="API"
                      checked={source === "API"}
                      onChange={() => setSource("API")}
                      disabled={!dashboard}
                    />
                    <span>API</span>
                  </label>
                </>
              )}
            </div>
            <div className="help">{isDental ? "Dental supports CSV or API." : (isPt ? "PT supports Google Sheet ID or API." : "Select dashboard to see sources.")}</div>
          </div>

          {showSheetId && (
            <div className="form-row">
              <label>Sheet ID</label>
              <input
                type="text"
                className="input"
                placeholder="Enter Google Sheet ID"
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
              />
              <div className="help">Paste the ID from your Google Sheet URL.</div>
            </div>
          )}

          {showApiSoon && (
            <div className="form-row">
              <label>Status</label>
              <div className="help">Feature coming soon</div>
            </div>
          )}
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="submit" className="upload">
            <span>Submit</span>
          </button>
        </div>
      </form>
    </div>
  )
}
