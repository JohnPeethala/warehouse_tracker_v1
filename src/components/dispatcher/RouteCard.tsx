'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Share2, Truck, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import AssignmentForm from './AssignmentForm'
import { createClient } from '@/utils/supabase/client'

interface RouteCardProps {
  routeName: string
  tickets: any[]
  vehicles: { vehicle_no: string; default_driver: string }[]
  groundTeams: { id: string; name: string }[]
}

export default function RouteCard({ routeName, tickets: initialTickets, vehicles, groundTeams }: RouteCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [tickets, setTickets] = useState(initialTickets)
  const supabase = createClient()

  // Subscribe to realtime changes for these tickets
  useEffect(() => {
    const ticketIds = initialTickets.map(t => t.id)
    const channel = supabase
      .channel(`route-${routeName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dispatch_log',
          filter: `route_name=eq.${routeName}`,
        },
        (payload) => {
          setTickets(prev =>
            prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [routeName])

  const delivered = tickets.filter(t => t.gt_status === 'Delivered').length
  const issues = tickets.filter(t => t.gt_status === 'Issue').length
  const total = tickets.length
  const pending = total - delivered - issues

  const firstTicket = tickets[0] || {}
  const progressPct = total > 0 ? Math.round((delivered / total) * 100) : 0

  const handleCopy = () => {
    const serial = firstTicket.vehicle_serial
    const label = serial === 1 ? '1st' : serial === 2 ? '2nd' : '3rd'
    const text = [
      `Hyd Warehouse - ${label} Vehicle`,
      `Route: ${routeName}`,
      `Driver: ${firstTicket.driver_name || 'Unassigned'}`,
      `Vehicle: ${firstTicket.vehicle_no || 'Unassigned'}`,
      `Ground Team: ${firstTicket.gt || 'Unassigned'}`,
      `Tickets: ${total} | Delivered: ${delivered} | Issues: ${issues} | Pending: ${pending}`,
    ].join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h3 className="font-bold text-lg text-gray-900 leading-tight">{routeName}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> {firstTicket.vehicle_no || '—'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {firstTicket.driver_name || 'Unassigned'}
              </span>
              {firstTicket.gt && (
                <>
                  <span>·</span>
                  <span className="text-blue-600 font-medium">GT: {firstTicket.gt}</span>
                </>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="text-gray-400 mt-1 shrink-0" /> : <ChevronDown className="text-gray-400 mt-1 shrink-0" />}
        </div>

        {/* Status Counts */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg text-green-700 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> {delivered}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-lg text-red-600 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" /> {issues}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" /> {pending}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{total} total</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex justify-end pt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Share2 className="w-4 h-4" /> Copy for WhatsApp
            </button>
          </div>
          <AssignmentForm
            routeName={routeName}
            tickets={tickets}
            vehicles={vehicles}
            groundTeams={groundTeams}
          />
        </div>
      )}
    </div>
  )
}
