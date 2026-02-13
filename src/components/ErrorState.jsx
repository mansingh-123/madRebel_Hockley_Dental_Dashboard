import React from "react"

export default function ErrorState({ title = "ID Required", message = "This page needs an ID in the URL to load your dashboard.", icon = "!" }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-text">
        {message}
      </div>
    </div>
  )
}
