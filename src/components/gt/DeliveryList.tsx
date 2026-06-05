'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import TicketCard from './TicketCard'

export default function DeliveryList({ tickets: initialTickets, odomStart, odomEnd }: {
  tickets: any[]
  odomStart?: number | null
  odomEnd?: number | null
}) {
  const [tickets] = useState(initialTickets)

  const delivered = tickets.filter(t => t.gt_status === 'Delivered').length
  const issues = tickets.filter(t => t.gt_status === 'Issue').length
  const pending = tickets.length - delivered - issues
  const distance = odomEnd && odomStart ? (odomEnd - odomStart).toFixed(1) : null

  const handleShareSummary = () => {
    const text = [
      `📦 Day Summary`,
      `Delivered: ${delivered}`,
      `Issues: ${issues}`,
      `Pending: ${pending}`,
      distance ? `Distance Travelled: ${distance} km` : null,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    alert('Summary copied to clipboard!')
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
        <span className="text-4xl">📭</span>
        <p className="font-medium text-sm">No deliveries assigned for today</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="font-bold text-green-600">{delivered}<span className="text-gray-500 font-normal ml-1">Del</span></span>
          <span className="font-bold text-red-500">{issues}<span className="text-gray-500 font-normal ml-1">Issues</span></span>
          <span className="font-bold text-gray-600">{pending}<span className="text-gray-500 font-normal ml-1">Pending</span></span>
        </div>
        <button
          onClick={handleShareSummary}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {/* Ticket List - Pending first */}
      {tickets
        .sort((a, b) => {
          const order = { null: 0, undefined: 0, Pending: 0, Issue: 1, Delivered: 2 }
          return (order[a.gt_status as keyof typeof order] ?? 0) - (order[b.gt_status as keyof typeof order] ?? 0)
        })
        .map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
    </div>
  )
}
