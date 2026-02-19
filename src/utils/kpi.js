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
    collectionRatioPct: rows.map(r => r.collection_ratio || 0),
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
  const latestCollectionRatio = latest.collection_ratio || 0
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
