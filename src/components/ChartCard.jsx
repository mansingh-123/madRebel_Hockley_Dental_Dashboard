import React, { useEffect, useRef } from "react"
import { Chart } from "chart.js/auto"

function toRgba(c, alpha = 1) {
  if (!c) return `rgba(0,0,0,${alpha})`
  if (c.startsWith("rgb")) {
    const nums = c.replace(/[rgba\(\)]/g, "").split(",").map(x => Number(x.trim()))
    const [r, g, b] = nums
    return `rgba(${r||0}, ${g||0}, ${b||0}, ${alpha})`
  }
  // hex #rrggbb
  const hex = c.replace("#","")
  const r = parseInt(hex.substring(0,2), 16)
  const g = parseInt(hex.substring(2,4), 16)
  const b = parseInt(hex.substring(4,6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function ChartCard({ title, months, datasets, type = "line" }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d")
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(ctx, {
      type,
      data: {
        labels: months,
        datasets: datasets.map(d => {
          const baseColor = d.color || "#a855f7"
          const isLine = type === "line"
          const lightenBar = !isLine && (title === "Production" || title === "Collections")
          return {
            label: d.label,
            data: d.data,
            borderColor: baseColor,
            backgroundColor: isLine ? toRgba(baseColor, 0.12) : toRgba(baseColor, lightenBar ? 0.35 : 0.85),
            pointBackgroundColor: isLine ? baseColor : undefined,
            pointBorderColor: isLine ? "#ffffff" : undefined,
            pointRadius: isLine ? 3 : 0,
            borderWidth: isLine ? 2 : 1,
            tension: 0.3,
            fill: isLine ? true : false
          }
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    })
    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [months, datasets, type])

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
