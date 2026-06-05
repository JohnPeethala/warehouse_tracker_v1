'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Loader2 } from 'lucide-react'

interface AssignmentFormProps {
  routeName: string
  tickets: any[]
  vehicles: { vehicle_no: string; default_driver: string }[]
  groundTeams: { id: string; name: string }[]
}

export default function AssignmentForm({ routeName, tickets, vehicles, groundTeams }: AssignmentFormProps) {
  const firstTicket = tickets[0] || {}
  const [vehicleNo, setVehicleNo] = useState(firstTicket.vehicle_no || '')
  const [driverName, setDriverName] = useState(firstTicket.driver_name || '')
  const [gt, setGt] = useState(firstTicket.gt || '')
  const [vehicleSerial, setVehicleSerial] = useState<number>(firstTicket.vehicle_serial || 1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  const handleVehicleChange = (vno: string) => {
    setVehicleNo(vno)
    const vehicle = vehicles.find(v => v.vehicle_no === vno)
    if (vehicle?.default_driver) {
      setDriverName(vehicle.default_driver)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    const ticketIds = tickets.map(t => t.id)

    const { error } = await supabase
      .from('dispatch_log')
      .update({
        vehicle_no: vehicleNo || null,
        driver_name: driverName || null,
        gt: gt || null,
        vehicle_serial: vehicleSerial,
        updated_at: new Date().toISOString(),
      })
      .in('id', ticketIds)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      alert('Failed to save. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assign Team</h4>

      {/* Vehicle Serial */}
      <div className="flex gap-2">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onClick={() => setVehicleSerial(n)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
              vehicleSerial === n
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {n === 1 ? '1st' : n === 2 ? '2nd' : '3rd'} Vehicle
          </button>
        ))}
      </div>

      {/* Vehicle No */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</label>
        <select
          value={vehicleNo}
          onChange={e => handleVehicleChange(e.target.value)}
          className="rounded-xl px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select vehicle...</option>
          {vehicles.map(v => (
            <option key={v.vehicle_no} value={v.vehicle_no}>
              {v.vehicle_no}
            </option>
          ))}
        </select>
      </div>

      {/* Driver Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver</label>
        <input
          type="text"
          value={driverName}
          onChange={e => setDriverName(e.target.value)}
          placeholder="Driver name..."
          className="rounded-xl px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Ground Team */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ground Team</label>
        <select
          value={gt}
          onChange={e => setGt(e.target.value)}
          className="rounded-xl px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select GT member...</option>
          {groundTeams.map(g => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'
        }`}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saved ? (
          '✓ Saved!'
        ) : (
          <><Save className="w-4 h-4" /> Save Assignment</>
        )}
      </button>
    </div>
  )
}
