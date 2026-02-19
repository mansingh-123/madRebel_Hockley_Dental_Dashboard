import React, { useState, useEffect } from "react"
import App from "./App.jsx"
import PTDashboard from "./PTDashboard.jsx"
import OnboardingForm from "./components/OnboardingForm.jsx"
import ErrorState from "./components/ErrorState.jsx"
import { fetchLocationDetails, postLocationOnboard } from "./services/data.js"

function getParam(name) {
  const params = new URLSearchParams(window.location.search)
  const v = params.get(name)
  return v ? String(v) : ""
}

function Toast({ message, onClose }) {
  if (!message) return null
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      background: "#ef4444",
      color: "white",
      padding: "12px 20px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: "12px"
    }}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: 0,
          opacity: 0.8
        }}
      >✕</button>
    </div>
  )
}

export default function Root() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toastError, setToastError] = useState("")
  const [onboarded, setOnboarded] = useState(false)
  const [template, setTemplate] = useState("")
  const [dataSource, setDataSource] = useState("")
  
  // Also support location_id for compatibility
  const locationId = getParam("locationId") || getParam("location_id")

  useEffect(() => {
    // If ID is completely missing, show "Location ID required" screen
    if (!locationId) {
      setLoading(false)
      setError("Location ID required")
      return
    }

    let alive = true
    fetchLocationDetails(locationId).then(res => {
      if (!alive) return
      
      // Handle success response
      if (res && res.status === "success") {
        if (res.is_onboarded) {
          setOnboarded(true)
          setTemplate(res.template || "DENTAL")
          if (res.data_source) {
            setDataSource(res.data_source)
          }
        } else {
          setOnboarded(false)
        }
      } 
      // Handle explicit error response from API
      else if (res && res.status === "error") {
        setToastError(res.message || "Failed to load location details")
        // If it's a critical error like "location_id is required" (though we checked client-side), 
        // or other fatal errors, we might want to block UI. 
        // But for now, if API errors out, we assume not onboarded or show error state?
        // Let's assume if fetch fails, we can't determine state, so show error screen or form.
        // If message is specific, show it.
        setError(res.message || "Error loading dashboard")
      }
      // Handle network/unexpected failures
      else {
        setToastError("Unexpected response from server")
        setError("Failed to connect to server")
      }
    }).catch((e) => {
      if (alive) {
        console.error(e)
        setToastError("Network error: Could not reach server")
        setError("Failed to load location details")
      }
    }).finally(() => {
      if (alive) setLoading(false)
    })
    
    return () => { alive = false }
  }, [locationId])

  async function handleOnboardSubmit(data) {
    const res = await postLocationOnboard(data)
    if (res && res.status === "success") {
      setTemplate(res.template)
      return res
    }
    // If onboarding fails, show toast
    if (res && res.status === "error") {
      setToastError(res.message || "Onboarding failed")
    }
    return res
  }
  
  function handleIngestionComplete() {
    setOnboarded(true)
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div style={{padding: 40, textAlign: "center", color: "#64748b"}}>Loading location details...</div>
        </div>
      </div>
    )
  }

  // Critical Error Screen (Blocking)
  if (error) {
    return (
      <div className="page">
        <header className="header">
          <div className="brand">KPI Dashboard</div>
        </header>
        <ErrorState message={error} />
        <Toast message={toastError} onClose={() => setToastError("")} />
      </div>
    )
  }

  // Onboarding Form
  if (!onboarded) {
    return (
      <div className="page">
        <div className="container">
          <OnboardingForm 
            locationId={locationId} 
            onSubmit={handleOnboardSubmit} 
            onComplete={handleIngestionComplete}
          />
        </div>
        <Toast message={toastError} onClose={() => setToastError("")} />
      </div>
    )
  }

  // Dashboard View
  return (
    <>
      {template === "PT" ? (
        <PTDashboard locationId={locationId} dataSource={dataSource} />
      ) : (
        <App locationId={locationId} />
      )}
      <Toast message={toastError} onClose={() => setToastError("")} />
    </>
  )
}
