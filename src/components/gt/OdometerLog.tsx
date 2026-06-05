'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Gauge, Loader2, CheckCircle2 } from 'lucide-react'

interface OdometerLogProps {
  profileId: string
  tripDate: string
}

export default function OdometerLog({ profileId, tripDate }: OdometerLogProps) {
  const supabase = createClient()

  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [odomStart, setOdomStart] = useState('')
  const [odomEnd, setOdomEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchTrip = async () => {
      const { data } = await supabase
        .from('gt_trips')
        .select('*')
        .eq('profile_id', profileId)
        .eq('trip_date', tripDate)
        .maybeSingle()

      if (data) {
        setTrip(data)
        setOdomStart(data.odometer_start?.toString() || '')
        setOdomEnd(data.odometer_end?.toString() || '')
      }
      setLoading(false)
    }
    fetchTrip()
  }, [profileId, tripDate])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    const payload = {
      profile_id: profileId,
      trip_date: tripDate,
      odometer_start: odomStart ? parseFloat(odomStart) : null,
      odometer_end: odomEnd ? parseFloat(odomEnd) : null,
    }

    let error
    if (trip) {
      const res = await supabase.from('gt_trips').update(payload).eq('id', trip.id)
      error = res.error
    } else {
      const res = await supabase.from('gt_trips').insert(payload).select().single()
      error = res.error
      if (!error && res.data) setTrip(res.data)
    }

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      alert('Failed to save odometer. Please try again.')
    }
  }

  const distance = odomEnd && odomStart
    ? (parseFloat(odomEnd) - parseFloat(odomStart)).toFixed(1)
    : null

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <Gauge className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Odometer Log</h3>
          <p className="text-xs text-gray-500">Record your trip readings</p>
        </div>
        {distance && (
          <span className="ml-auto bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-lg">
            {distance} km
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Start (km)</label>
          <input
            type="number"
            inputMode="decimal"
            value={odomStart}
            onChange={e => setOdomStart(e.target.value)}
            placeholder="e.g. 12400"
            className="rounded-xl px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">End (km)</label>
          <input
            type="number"
            inputMode="decimal"
            value={odomEnd}
            onChange={e => setOdomEnd(e.target.value)}
            placeholder="e.g. 12560"
            className="rounded-xl px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !odomStart}
        className={`mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400'
        }`}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Saved!</>
        ) : (
          'Save Reading'
        )}
      </button>
    </div>
  )
}
