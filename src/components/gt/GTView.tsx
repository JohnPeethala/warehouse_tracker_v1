'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Copy, Check } from 'lucide-react'
import { updateTicketStatus as dbUpdateTicketStatus } from '@/services/database'
import { CalendarPicker } from '@/components/shared/CalendarPicker'
import { OdometerLog, Trip } from '@/components/gt/OdometerLog'
import { TicketCard } from '@/components/gt/TicketCard'
import type { Log, GTStatusOption, SubCategoryOption } from '@/types/models'

type Props = {
  profileId: string
  userName: string
  trip: Trip | null
  assignedVehicle: string
  assignedDriver: string
  logs: Log[]
  today: string
  statusOptions: GTStatusOption[]
  subCategories: SubCategoryOption[]
}

export default function GTView({ profileId, userName, trip, assignedVehicle, assignedDriver, logs, today, statusOptions, subCategories }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [localLogs, setLocalLogs] = useState<Log[]>(logs)
  const [savingLog, setSavingLog] = useState<string | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalLogs(logs)
  }, [logs])

  async function handleSignOut() {
    const { createClient } = await import('@/utils/supabase/client')
    await createClient().auth.signOut()
    router.replace('/login')
  }

  async function updateTicketStatus(logId: string, newStatus: string, remarks: string) {
    setSavingLog(logId)
    
    let gpsLink = null
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      gpsLink = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) {
      console.log('GPS Capture failed or denied', e)
    }

    const payload = {
      gt_status: newStatus,
      remarks: remarks || null,
      gt_maps_link: gpsLink || null,
      gt_updated_at: new Date().toISOString()
    }

    await dbUpdateTicketStatus(logId, payload)
    setLocalLogs(prev => prev.map(l => l.id === logId ? { ...l, gt_status: newStatus, remarks, gt_maps_link: gpsLink } : l))
    setSavingLog(null)
  }

  function handleCopyEOD() {
    const total = localLogs.length
    const doneCount = localLogs.filter(l => l.gt_status === 'Done').length
    const notDoneCount = total - doneCount

    const d = new Date(today + 'T00:00:00')
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const subcats: Record<string, { done: number; total: number }> = {}
    localLogs.forEach(l => {
      const cat = l.sub_category || 'Other'
      if (!subcats[cat]) subcats[cat] = { done: 0, total: 0 }
      subcats[cat].total += 1
      if (l.gt_status === 'Done') subcats[cat].done += 1
    })

    function getEmoji(status: string | null) {
      const s = (status || '').toLowerCase()
      if (s.includes('done')) return '✅'
      if (s.includes('cancel')) return '🚫'
      if (s.includes('reschedule')) return '🔄'
      if (s.includes('not responding')) return '📵'
      if (s.includes('issue')) return '⚠️'
      if (s.includes('other')) return '📌'
      return '🕐'
    }

    const lines: string[] = []

    lines.push(`*EOD — ${dateStr}*`)
    lines.push(`👤 ${userName.trim()}`)
    lines.push(`🚗 ${assignedDriver || 'N/A'}   ${assignedVehicle || 'N/A'}`)
    lines.push('')
    lines.push(`Done *${doneCount}/${total}*   Remaining *${notDoneCount}*`)
    lines.push('')

    const catKeys = Object.keys(subcats).sort()
    catKeys.forEach(cat => {
      const { done, total: t } = subcats[cat]
      lines.push(`  ${cat}  ${done}/${t}`)
    })
    lines.push('')
    lines.push('─────────────────')

    localLogs.forEach(log => {
      const status = log.gt_status || 'Pending'
      const emoji = getEmoji(status)
      lines.push(`${emoji}  #${log.ticket_id}  ${log.contact_name || 'No Name'}`)
      if (log.remarks) {
        lines.push(`       ${log.remarks}`)
      }
    })

    navigator.clipboard.writeText(lines.join('\n').trim())
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* ── Header ── */}
      <header className="shrink-0 bg-card border-b border-border shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] px-4 pt-4 pb-3 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-primary/10">
              <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block text-lg font-bold text-foreground leading-none">Warehouse OPs</span>
              <span className="block text-sm text-foreground/50 mt-1.5 font-medium">{userName.split(' ')[0]}</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-muted text-foreground/50 transition-colors">
            <LogOut size={16}/>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <CalendarPicker value={today} onChange={d => {
            startTransition(() => { router.push(`?date=${d}`) })
          }} />
          <div className="text-sm font-semibold text-foreground/40">{localLogs.length} Assigned</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <OdometerLog 
          profileId={profileId}
          today={today}
          assignedVehicle={assignedVehicle}
          assignedDriver={assignedDriver}
          trip={trip}
        />

        {/* ── Assigned Tickets ── */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base font-bold text-foreground">Assigned Tickets ({localLogs.length})</h2>
            {localLogs.length > 0 && (
              <button 
                onClick={handleCopyEOD}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  copiedSummary ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                {copiedSummary ? 'Copied!' : 'Copy EOD'}
              </button>
            )}
          </div>
          
          {localLogs.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
              <p className="text-base font-medium text-foreground/40">No tickets assigned today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {localLogs.map((log, i) => (
                <TicketCard 
                  key={log.id} 
                  log={log} 
                  index={i + 1}
                  statusOptions={statusOptions}
                  subCategories={subCategories}
                  onSave={(status, remarks) => updateTicketStatus(log.id, status, remarks)}
                  isSaving={savingLog === log.id}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="h-8" />
      </div>
    </div>
  )
}
