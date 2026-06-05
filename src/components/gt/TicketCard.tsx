'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { addToSyncQueue } from '@/utils/offline/sync'
import { MapPin, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export default function TicketCard({ ticket: initialTicket }: { ticket: any }) {
  const supabase = createClient()
  const [ticket, setTicket] = useState(initialTicket)
  const [expanded, setExpanded] = useState(false)
  const [remarks, setRemarks] = useState(ticket.remarks || '')
  const [updating, setUpdating] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>('')

  const getGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      setLocationStatus('Capturing GPS...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus('')
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          setLocationStatus('GPS failed, saving without location')
          setTimeout(() => setLocationStatus(''), 3000)
          resolve(null)
        },
        { timeout: 8000 }
      )
    })
  }

  const handleStatusUpdate = async (status: 'Delivered' | 'Issue') => {
    if (status === 'Issue' && !remarks.trim()) {
      alert('Please enter remarks for the issue before saving.')
      return
    }

    setUpdating(true)

    const gps = await getGPS()

    const payload = {
      ticket_id: ticket.ticket_id,
      gt_status: status,
      gt_location_lat: gps?.lat ?? null,
      gt_location_lng: gps?.lng ?? null,
      remarks: remarks || null,
    }

    if (!navigator.onLine) {
      // Queue for offline sync
      await addToSyncQueue('UPDATE_TICKET', payload)
      setTicket((prev: any) => ({ ...prev, gt_status: status, remarks }))
      setUpdating(false)
      setExpanded(false)
      return
    }

    const { error } = await supabase
      .from('dispatch_log')
      .update({
        gt_status: status,
        gt_location_lat: gps?.lat ?? null,
        gt_location_lng: gps?.lng ?? null,
        remarks: remarks || null,
        gt_updated_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)

    if (!error) {
      setTicket((prev: any) => ({ ...prev, gt_status: status, remarks }))
      setExpanded(false)
    } else {
      // Fallback to offline queue on error
      await addToSyncQueue('UPDATE_TICKET', payload)
      setTicket((prev: any) => ({ ...prev, gt_status: status, remarks }))
      setExpanded(false)
    }

    setUpdating(false)
  }

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    Delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
    Issue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Issue' },
    Attempted: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Attempted' },
  }
  const sc = statusConfig[ticket.gt_status] || { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Pending' }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      ticket.gt_status === 'Delivered' ? 'border-green-200' 
      : ticket.gt_status === 'Issue' ? 'border-red-200' 
      : 'border-gray-200'
    }`}>
      {/* Summary Row */}
      <div
        className="p-4 flex items-start gap-3 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text} whitespace-nowrap`}>
          {sc.label}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{ticket.contact_name || ticket.ticket_id}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{ticket.location || ticket.address || ticket.ticket_id}</p>
        </div>
        {expanded ? <ChevronUp className="text-gray-400 shrink-0" size={18} /> : <ChevronDown className="text-gray-400 shrink-0" size={18} />}
      </div>

      {/* Expanded Actions */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-3">
          {locationStatus && (
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {locationStatus}
            </div>
          )}

          {/* Remarks */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
              Remarks {ticket.gt_status !== 'Delivered' && '(required for Issue)'}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Add notes about this delivery..."
              className="rounded-xl px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              disabled={updating}
              onClick={() => handleStatusUpdate('Delivered')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Delivered
            </button>
            <button
              disabled={updating}
              onClick={() => handleStatusUpdate('Issue')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Issue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
