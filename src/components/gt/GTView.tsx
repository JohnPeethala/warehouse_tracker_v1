'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogOut } from 'lucide-react'
import { CalendarPicker } from '@/components/shared/CalendarPicker'
import { OdometerLog, Trip } from '@/components/gt/OdometerLog'
import { TicketCard, Log, StatusOption } from '@/components/gt/TicketCard'

type Props = {
  profileId: string
  userName: string
  trip: Trip | null
  assignedVehicle: string
  assignedDriver: string
  logs: Log[]
  today: string
  statusOptions: StatusOption[]
}

export default function GTView({ profileId, userName, trip, assignedVehicle, assignedDriver, logs, today, statusOptions }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Logs state (local overrides for optimistic UI)
  const [localLogs, setLocalLogs] = useState<Log[]>(logs)
  const [savingLog, setSavingLog] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalLogs(logs)
  }, [logs])

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  async function updateTicketStatus(logId: string, newStatus: string, remarks: string) {
    setSavingLog(logId)
    
    // Capture GPS if available
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

    await createClient().from('dispatch_log').update(payload).eq('id', logId)

    setLocalLogs(prev => prev.map(l => l.id === logId ? { ...l, gt_status: newStatus, remarks, gt_maps_link: gpsLink } : l))
    setSavingLog(null)
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* ── Header ── */}
      <header className="shrink-0 bg-card border-b border-border shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] px-4 pt-12 pb-3 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm overflow-hidden bg-primary/10">
              <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block text-sm font-bold text-foreground leading-none">Warehouse OPs</span>
              <span className="block text-[10px] text-foreground/50 mt-0.5 font-medium">{userName.split(' ')[0]}</span>
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
          <div className="text-xs font-semibold text-foreground/40">{localLogs.length} Assigned</div>
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
          <h2 className="text-sm font-bold text-foreground mb-3 px-1">Assigned Tickets ({localLogs.length})</h2>
          
          {localLogs.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
              <p className="text-sm font-medium text-foreground/40">No tickets assigned today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {localLogs.map((log, i) => (
                <TicketCard 
                  key={log.id} 
                  log={log} 
                  index={i + 1}
                  statusOptions={statusOptions}
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
