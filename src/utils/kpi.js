const goalNewPatientsPerMonth = 200

function pct(numerator, denominator) {
  const n = Number(numerator || 0)
  const d = Number(denominator || 0)
  if (!d || d <= 0) return 0
  return Math.round((n / d) * 100)
}

export function monthsFromData(rows) {
  return rows.map(r => r.month)
}

export function computeKpis(rows) {
  const series = {
    activePatients: rows.map(r => r.active_patients || 0),
    productionGeneral: rows.map(r => r.production_general || 0),
    productionOrtho: rows.map(r => r.production_ortho || 0),
    productionTotal: rows.map(r => (r.production_general || 0) + (r.production_ortho || 0)),
    collectionsGeneral: rows.map(r => r.collections_general || 0),
    collectionsOrtho: rows.map(r => r.collections_ortho || 0),
    collectionsTotal: rows.map(r => (r.collections_general || 0) + (r.collections_ortho || 0)),
    newPatients: rows.map(r => r.new_patients || 0),
    lostPatients: rows.map(r => r.lost_patients || 0),
    collectionRatioPct: rows.map(r => pct((r.collections_general || 0) + (r.collections_ortho || 0), (r.production_general || 0) + (r.production_ortho || 0))),
    cancellationRatePct: rows.map(r => pct(r.cancelled_appointments || 0, r.scheduled_appointments || 0)),
    noShowRatePct: rows.map(r => pct(r.no_show_appointments || 0, r.scheduled_appointments || 0)),
    fillRatePct: rows.map(r => {
      const scheduled = r.scheduled_appointments || 0
      const cancelled = r.cancelled_appointments || 0
      const noShow = r.no_show_appointments || 0
      const filled = scheduled - cancelled - noShow
      return pct(filled, scheduled)
    }),
    netPatientGrowth: rows.map(r => (r.new_patients || 0) - (r.lost_patients || 0)),
    newPatientGoal: rows.map(r => r.new_patient_goal || goalNewPatientsPerMonth),
    treatmentAcceptancePct: rows.map(r => pct(r.treatment_accepted || 0, r.treatment_proposed || 0)),
    lostProduction: rows.map(r => r.lost_production || 0),
    lostCancelled: rows.map(r => r.lost_cancelled || 0),
    lostNoShow: rows.map(r => r.lost_noshow || 0),
    cancelledAppointments: rows.map(r => r.cancelled_appointments || 0),
    noShowAppointments: rows.map(r => r.no_show_appointments || 0),
    missedAppointments: rows.map(r => (r.cancelled_appointments || 0) + (r.no_show_appointments || 0))
  }

  const latest = rows[rows.length - 1] || {}
  const latestCollectionRatio = pct((latest.collections_general || 0) + (latest.collections_ortho || 0), (latest.production_general || 0) + (latest.production_ortho || 0))
  const latestCancellationRate = pct(latest.cancelled_appointments || 0, latest.scheduled_appointments || 0)
  const latestNoShowRate = pct(latest.no_show_appointments || 0, latest.scheduled_appointments || 0)
  const latestFillRate = (() => {
    const scheduled = latest.scheduled_appointments || 0
    const cancelled = latest.cancelled_appointments || 0
    const noShow = latest.no_show_appointments || 0
    const filled = scheduled - cancelled - noShow
    return pct(filled, scheduled)
  })()
  const latestNetGrowth = (latest.new_patients || 0) - (latest.lost_patients || 0)
  const latestTreatmentAcc = pct(latest.treatment_accepted || 0, latest.treatment_proposed || 0)

  const latestSummary = {
    activePatients: latest.active_patients || 0,
    newPatients: latest.new_patients || 0,
    newPatientGoal: latest.new_patient_goal || goalNewPatientsPerMonth,
    lostPatients: latest.lost_patients || 0,
    netPatientGrowth: latestNetGrowth,
    productionGeneral: latest.production_general || 0,
    productionOrtho: latest.production_ortho || 0,
    productionTotal: (latest.production_general || 0) + (latest.production_ortho || 0),
    collectionsGeneral: latest.collections_general || 0,
    collectionsOrtho: latest.collections_ortho || 0,
    collectionsTotal: (latest.collections_general || 0) + (latest.collections_ortho || 0),
    collectionRatioPct: latestCollectionRatio,
    cancellationRatePct: latestCancellationRate,
    noShowRatePct: latestNoShowRate,
    fillRatePct: latestFillRate,
    lostProduction: latest.lost_production || 0,
    lostCancelled: latest.lost_cancelled || 0,
    lostNoShow: latest.lost_noshow || 0,
    scheduledAppointments: latest.scheduled_appointments || 0,
    cancelledAppointments: latest.cancelled_appointments || 0,
    noShowAppointments: latest.no_show_appointments || 0,
    treatmentAcceptancePct: latestTreatmentAcc,
    aiInsights: [
      "New patients trending down vs prior month. Monitor recovery closely.",
      `Net growth positive (+${latestNetGrowth}) but softening; review retention drivers.`,
      `Collection ratio at ${latestCollectionRatio}%. AR appears healthy.`,
      "ORTHO holding near 30% of total production.",
      `$${Number(latest.lost_production || 0).toLocaleString()} lost to cancellations/no-shows.`
    ],
    actionItems: [
      "Launch reactivation campaign targeting inactive patients this week.",
      "Review no-show patterns; consider overbooking or card-on-file for high-risk slots.",
      "Case presentation refresher; add financing options to scripts."
    ]
  }

  return { series, latest: latestSummary }
}

export const sampleMonthlyData = [
  {
    month: "Jan",
    active_patients: 4200,
    new_patients: 180,
    lost_patients: 100,
    production_general: 250000,
    production_ortho: 90000,
    collections_general: 230000,
    collections_ortho: 85000,
    scheduled_appointments: 1800,
    cancelled_appointments: 160,
    no_show_appointments: 90,
    lost_production: 28000,
    lost_cancelled: 18000,
    lost_noshow: 10000,
    treatment_proposed: 400000,
    treatment_accepted: 180000
  },
  {
    month: "Feb",
    active_patients: 4250,
    new_patients: 195,
    lost_patients: 110,
    production_general: 270000,
    production_ortho: 95000,
    collections_general: 260000,
    collections_ortho: 90000,
    scheduled_appointments: 1900,
    cancelled_appointments: 150,
    no_show_appointments: 85,
    lost_production: 26000,
    lost_cancelled: 16000,
    lost_noshow: 10000,
    treatment_proposed: 420000,
    treatment_accepted: 210000
  },
  {
    month: "Mar",
    active_patients: 4300,
    new_patients: 205,
    lost_patients: 95,
    production_general: 280000,
    production_ortho: 98000,
    collections_general: 270000,
    collections_ortho: 95000,
    scheduled_appointments: 1950,
    cancelled_appointments: 140,
    no_show_appointments: 80,
    lost_production: 24000,
    lost_cancelled: 15000,
    lost_noshow: 9000,
    treatment_proposed: 430000,
    treatment_accepted: 235000
  },
  {
    month: "Apr",
    active_patients: 4350,
    new_patients: 210,
    lost_patients: 100,
    production_general: 290000,
    production_ortho: 100000,
    collections_general: 275000,
    collections_ortho: 97000,
    scheduled_appointments: 2000,
    cancelled_appointments: 150,
    no_show_appointments: 82,
    lost_production: 25000,
    lost_cancelled: 16000,
    lost_noshow: 9000,
    treatment_proposed: 440000,
    treatment_accepted: 240000
  },
  {
    month: "May",
    active_patients: 4400,
    new_patients: 198,
    lost_patients: 120,
    production_general: 285000,
    production_ortho: 102000,
    collections_general: 270000,
    collections_ortho: 98000,
    scheduled_appointments: 1980,
    cancelled_appointments: 165,
    no_show_appointments: 88,
    lost_production: 27000,
    lost_cancelled: 18500,
    lost_noshow: 8500,
    treatment_proposed: 435000,
    treatment_accepted: 220000
  },
  {
    month: "Jun",
    active_patients: 4450,
    new_patients: 215,
    lost_patients: 105,
    production_general: 300000,
    production_ortho: 105000,
    collections_general: 290000,
    collections_ortho: 100000,
    scheduled_appointments: 2050,
    cancelled_appointments: 150,
    no_show_appointments: 84,
    lost_production: 24000,
    lost_cancelled: 15500,
    lost_noshow: 8500,
    treatment_proposed: 450000,
    treatment_accepted: 250000
  }
] 
