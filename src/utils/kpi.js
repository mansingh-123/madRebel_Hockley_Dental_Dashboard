const goalNewPatientsPerMonth = 200

function pct(numerator, denominator) {
  const n = Number(numerator || 0)
  const d = Number(denominator || 0)
  if (!d || d <= 0) return 0
  return (n / d) * 100  
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
    // Use pre-calculated values from API
    collectionRatioPct: rows.map(r => r.collection_ratio || 0),
    cancellationRatePct: rows.map(r => r.cancellation_rate || 0),
    noShowRatePct: rows.map(r => r.no_show_rate || 0),
    fillRatePct: rows.map(r => r.fill_rate || 0),
    treatmentAcceptancePct: rows.map(r => r.treatment_acceptance || 0),
    netPatientGrowth: rows.map(r => (r.new_patients || 0) - (r.lost_patients || 0)),
    newPatientGoal: rows.map(r => r.new_patient_goal || goalNewPatientsPerMonth),
    lostProduction: rows.map(r => r.lost_production || 0),
    lostCancelled: rows.map(r => r.lost_cancelled || 0),
    lostNoShow: rows.map(r => r.lost_noshow || 0),
    cancelledAppointments: rows.map(r => r.cancelled_appointments || 0),
    noShowAppointments: rows.map(r => r.no_show_appointments || 0),
    missedAppointments: rows.map(r => (r.cancelled_appointments || 0) + (r.no_show_appointments || 0))
  }

  const latest = rows[rows.length - 1] || {} 

  // Build latest summary directly from the row's pre-calculated fields
  const latestSummary = {
    activePatients: latest.active_patients || 0,
    newPatients: latest.new_patients || 0,
    newPatientGoal: latest.new_patient_goal || goalNewPatientsPerMonth,
    lostPatients: latest.lost_patients || 0,
    netPatientGrowth: (latest.new_patients || 0) - (latest.lost_patients || 0),
    productionGeneral: latest.production_general || 0,
    productionOrtho: latest.production_ortho || 0,
    productionTotal: (latest.production_general || 0) + (latest.production_ortho || 0),
    collectionsGeneral: latest.collections_general || 0,
    collectionsOrtho: latest.collections_ortho || 0,
    collectionsTotal: (latest.collections_general || 0) + (latest.collections_ortho || 0),
    collectionRatioPct: latest.collection_ratio || 0,
    cancellationRatePct: latest.cancellation_rate || 0,
    noShowRatePct: latest.no_show_rate || 0,
    fillRatePct: latest.fill_rate || 0,
    lostProduction: latest.lost_production || 0,
    lostCancelled: latest.lost_cancelled || 0,
    lostNoShow: latest.lost_noshow || 0,
    scheduledAppointments: latest.scheduled_appointments || 0,
    cancelledAppointments: latest.cancelled_appointments || 0,
    noShowAppointments: latest.no_show_appointments || 0,
    treatmentAcceptancePct: latest.treatment_acceptance || 0,
  }

  return { series, latest: latestSummary }
}