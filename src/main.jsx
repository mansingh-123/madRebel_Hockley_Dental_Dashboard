import React from "react"
import { createRoot } from "react-dom/client"
import Root from "./Root.jsx"
import "./styles.css"

const rootEl = document.getElementById("root")
createRoot(rootEl).render(<Root />)
