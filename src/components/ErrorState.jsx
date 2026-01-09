import React from "react"

export default function ErrorState() {
  return (
    <div className="empty">
      <div className="empty-icon">!</div>
      <div className="empty-title">ID Required</div>
      <div className="empty-text">
        This page needs an ID in the URL to load your dashboard.
      </div>
    </div>
  )
}
