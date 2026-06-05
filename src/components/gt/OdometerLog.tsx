import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export type Trip = {
  id: string
  vehicle_no: string | null
  odometer_start: number | null
  odometer_end: number | null
}

type Props = {
  profileId: string
  today: string
  assignedVehicle: string
  assignedDriver: string
  trip: Trip | null
}

export function OdometerLog({ profileId, today, assignedVehicle, assignedDriver, trip }: Props) {
  // Trip state
  const [tripState, setTripState] = useState<Partial<Trip>>(trip || { 
    vehicle_no: assignedVehicle 
  })
  const [savingTrip, setSavingTrip] = useState(false)

  async function saveTrip(field: keyof Trip, value: any) {
    const newVal = { ...tripState, [field]: value }
    setTripState(newVal)
    setSavingTrip(true)

    const payload = {
      profile_id: profileId,
      trip_date: today,
      vehicle_no: newVal.vehicle_no || null,
      odometer_start: newVal.odometer_start || null,
      odometer_end: newVal.odometer_end || null,
      updated_at: new Date().toISOString()
    }

    await createClient().from('gt_trips').upsert(payload, { onConflict: 'profile_id,trip_date' })
    setSavingTrip(false)
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
          Daily Odometer
        </h2>
        {savingTrip && <span className="text-[10px] text-primary animate-pulse">Saving...</span>}
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Vehicle No.</p>
          <div className="w-full bg-muted/50 border border-border/50 rounded-md px-2.5 py-2 text-xs font-semibold text-foreground/80 cursor-not-allowed">
            {assignedVehicle || '—'}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Driver Name</p>
          <div className="w-full bg-muted/50 border border-border/50 rounded-md px-2.5 py-2 text-xs font-semibold text-foreground/80 cursor-not-allowed">
            {assignedDriver || '—'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Start (km)</p>
          <input 
            type="number" 
            value={tripState.odometer_start || ''} 
            onChange={e => setTripState(s => ({ ...s, odometer_start: parseFloat(e.target.value) || null }))}
            onBlur={e => saveTrip('odometer_start', parseFloat(e.target.value) || null)}
            placeholder="e.g. 45000"
            className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md px-2.5 py-2 text-xs shadow-sm transition-all"
          />
        </div>
        <div>
          <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">End (km)</p>
          <input 
            type="number" 
            value={tripState.odometer_end || ''} 
            onChange={e => setTripState(s => ({ ...s, odometer_end: parseFloat(e.target.value) || null }))}
            onBlur={e => saveTrip('odometer_end', parseFloat(e.target.value) || null)}
            placeholder="e.g. 45120"
            className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md px-2.5 py-2 text-xs shadow-sm transition-all"
          />
        </div>
      </div>
    </div>
  )
}
