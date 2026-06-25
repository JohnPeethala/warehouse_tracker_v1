'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Copy, Check, Car, ChevronDown } from 'lucide-react'
import { updateTicketStatus as dbUpdateTicketStatus } from '@/services/database'
import { CalendarPicker } from '@/components/shared/CalendarPicker'
import { SearchBar } from '@/components/shared/SearchBar'
import { OdometerLog, Trip } from '@/components/gt/OdometerLog'
import { TicketCard } from '@/components/gt/TicketCard'
import type { Log, GTStatusOption, DTStatusOption, SubCategoryOption } from '@/types/models'

type Props = {
  profileId: string
  userName: string
  trip: Trip | null
  assignedVehicle: string
  assignedDriver: string
  logs: Log[]
  today: string
  statusOptions: GTStatusOption[]
  dtStatusOptions: DTStatusOption[]
  subCategories: SubCategoryOption[]
}

export default function GTView({ profileId, userName, trip, assignedVehicle, assignedDriver, logs, today, statusOptions, dtStatusOptions, subCategories }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [localLogs, setLocalLogs] = useState<Log[]>(logs)
  const [savingLog, setSavingLog] = useState<string | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [showOdometer, setShowOdometer] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalLogs(logs)
  }, [logs])

  async function handleSignOut() {
    const { createClient } = await import('@/utils/supabase/client')
    await createClient().auth.signOut()
    router.replace('/login')
  }

  async function updateTicketStatus(logId: string, newStatus: string, remarks: string, dtStatus?: string | null, withLocation: boolean = false) {
    setSavingLog(logId)
    
    let gpsLink = null
    if (withLocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        })
        gpsLink = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
      } catch (e) {
        console.log('GPS Capture failed or denied', e)
      }
    }

    const payload = {
      gt_status: newStatus,
      dt_status: dtStatus,
      remarks: remarks || null,
      gt_maps_link: gpsLink || null,
      gt_updated_at: new Date().toISOString()
    }

    await dbUpdateTicketStatus(logId, payload)
    setLocalLogs(prev => prev.map(l => l.id === logId ? { ...l, gt_status: newStatus, dt_status: dtStatus, remarks, ...(gpsLink ? { gt_maps_link: gpsLink } : {}) } : l))
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

    function getStatusMark(status: string | null) {
      const s = (status || '').toLowerCase()
      if (s.includes('done')) return '✅'
      if (s.includes('cancel')) return '❌'
      if (s.includes('reschedule')) return '🔄'
      if (s.includes('not responding')) return '📵'
      if (s.includes('issue')) return '⚠️'
      return '⚪'
    }

    const lines: string[] = []

    // Extract team names from the first assigned log, fallback to userName
    let teamNames = userName.trim()
    if (localLogs.length > 0) {
      const firstLog = localLogs[0]
      const names = [firstLog.gt, firstLog.gt2].filter(Boolean).map(n => n?.trim())
      if (names.length > 0) {
        teamNames = names.join(' & ')
      }
    }

    const odoStart = trip?.odometer_start ? trip.odometer_start : '___'
    const odoEnd = trip?.odometer_end ? trip.odometer_end : '___'
    const totalKm = trip?.odometer_start && trip?.odometer_end ? (trip.odometer_end - trip.odometer_start).toFixed(1) : '___'

    lines.push(`*EOD — ${dateStr}*`)
    lines.push(`${teamNames}`)
    lines.push(`${assignedDriver || 'N/A'}   ${assignedVehicle || 'N/A'}`)
    lines.push(`Odo: Start ${odoStart} - End ${odoEnd} (Total: ${totalKm} km)`)
    lines.push('')
    lines.push(`Done: *${doneCount}/${total}*   Not Done: *${notDoneCount}*`)
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
      const mark = getStatusMark(status)
      lines.push(`${mark}  #${log.ticket_id}  ${log.contact_name || 'No Name'}  — ${status}`)
      if (log.remarks) {
        lines.push(`     ${log.remarks}`)
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
            <div className="w-10 h-10 rounded-md flex items-center justify-center shadow-sm overflow-hidden bg-primary/10">
              <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block text-lg font-bold text-foreground leading-none">Warehouse OPs</span>
              <span className="block text-sm text-foreground/50 mt-1.5 font-medium">{userName.split(' ')[0]}</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-md hover:bg-muted text-foreground/50 transition-colors">
            <LogOut size={16}/>
          </button>
        </div>
        <div className="flex items-center justify-between mb-3">
          <CalendarPicker value={today} onChange={d => {
            startTransition(() => { router.push(`?date=${d}`) })
          }} />
          <div className="text-sm font-semibold text-foreground/40">{localLogs.length} Assigned</div>
        </div>
        <div>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search tickets or names..." 
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        
        {/* ── Vehicle Log Banner ── */}
        <button 
          onClick={() => setShowOdometer(true)}
          className="w-full bg-card border border-border shadow-sm rounded-lg p-4 flex items-center justify-between text-left transition-colors hover:bg-muted/50 relative overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-md text-primary">
              <Car size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm leading-tight mb-0.5">Vehicle Log</h3>
              <p className="text-xs font-medium text-foreground/50">{assignedVehicle || 'No Vehicle'} • {assignedDriver || 'No Driver'}</p>
            </div>
          </div>
          
          {trip && (!trip.odometer_start || !trip.odometer_end) ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Action Req
            </div>
          ) : (
            <div className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
              <Check size={12}/> Done
            </div>
          )}
        </button>

        {/* ── Assigned Tickets ── */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base font-bold text-foreground">Assigned Tickets ({localLogs.length})</h2>
            {localLogs.length > 0 && (
              <button 
                onClick={handleCopyEOD}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                  copiedSummary ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                {copiedSummary ? 'Copied!' : 'Copy EOD'}
              </button>
            )}
          </div>
          
          {localLogs.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-md p-8 text-center">
              <p className="text-base font-medium text-foreground/40">No tickets assigned today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {localLogs
                .filter(l => {
                  if (!searchQuery) return true
                  const q = searchQuery.toLowerCase()
                  return l.ticket_id?.toLowerCase().includes(q) || 
                         l.contact_name?.toLowerCase().includes(q)
                })
                .map((log, i) => (
                <TicketCard 
                  key={log.id} 
                  log={log} 
                  index={i + 1}
                  statusOptions={statusOptions}
                  dtStatusOptions={dtStatusOptions}
                  subCategories={subCategories}
                  onSave={(status, remarks, dtStatus, withLoc) => updateTicketStatus(log.id, status, remarks, dtStatus, withLoc)}
                  isSaving={savingLog === log.id}
                  isSelected={selectedTicketId === log.id}
                  onSelect={() => setSelectedTicketId(log.id)}
                  onClose={() => setSelectedTicketId(null)}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="h-8" />
      </div>

      {/* ── Odometer Bottom Sheet ── */}
      {showOdometer && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={() => setShowOdometer(false)} />
          <div className="relative bg-background rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh] w-full animate-in slide-in-from-bottom-full duration-300 border-t border-border overflow-hidden">
            <div className="shrink-0 flex justify-center pt-3 pb-1 w-full bg-card rounded-t-2xl" onClick={() => setShowOdometer(false)}>
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="shrink-0 px-4 pb-4 pt-1 border-b border-border bg-card flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground leading-none">Vehicle Log</h2>
                <p className="text-sm text-foreground/50 mt-1 font-medium">{assignedVehicle || 'No Vehicle'} • {assignedDriver || 'No Driver'}</p>
              </div>
              <button onClick={() => setShowOdometer(false)} className="p-2 bg-muted/50 text-foreground/60 rounded-md hover:bg-muted hover:text-foreground transition-colors">
                <ChevronDown size={20} />
              </button>
            </div>
            <div className="overflow-y-auto min-h-0 bg-muted/10 p-4 pb-8">
              <OdometerLog 
                profileId={profileId}
                today={today}
                assignedVehicle={assignedVehicle}
                assignedDriver={assignedDriver}
                trip={trip}
                onClose={() => setShowOdometer(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
