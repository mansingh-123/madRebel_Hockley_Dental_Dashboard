import React, { useEffect, useRef } from "react"
import { Chart } from "chart.js/auto"

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
        datasets: datasets.map(d => ({
          label: d.label,
          data: d.data,
          borderColor: d.color,
          backgroundColor: d.color,
          tension: 0.3
        }))
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
