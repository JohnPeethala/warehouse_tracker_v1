'use client'

import { useState, useTransition, useRef, useEffect, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Calendar, LogOut,
  Truck, PackageOpen, PackageMinus, ArrowRightLeft,
  ArrowUpCircle, RefreshCw, Wrench, Hammer, AlertTriangle,
  HelpCircle, User, Copy, Check, MapPin
} from 'lucide-react'
import { updateDispatchLogs } from '@/services/database'
import { CalendarPicker } from '@/components/shared/CalendarPicker'
import { SearchBar } from '@/components/shared/SearchBar'
import { getSubIcon } from '@/components/shared/icons'

import type { Log, Vehicle, RouteGroup, GTMember, SubCategoryOption } from '@/types/models'

type Props = {
  selectedDate: string; logs: Log[]
  vehicles: Vehicle[];  groundTeam: GTMember[]
  subCategories: SubCategoryOption[]
  userName: string
}

/* ─── Helpers ────────────────────────────────────────── */
const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_ABBR   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function groupByRoute(logs: Log[]): RouteGroup[] {
  const map = new Map<string, RouteGroup>()
  for (const log of logs) {
    const key = log.route_name ?? 'Unassigned'
    if (!map.has(key)) map.set(key, {
      route_name: key, logs: [],
      vehicle_no: log.vehicle_no ?? '',
      driver_name: log.driver_name ?? '',
      gt: log.gt ?? '',
      gt_id: log.gt_id ?? null,
      gt2: log.gt2 ?? '',
      gt2_id: log.gt2_id ?? null,
      vehicle_serial: log.vehicle_serial ?? null
    })
    map.get(key)!.logs.push(log)
  }
  return Array.from(map.values())
}

function buildRouteMsg(route: RouteGroup, date: string) {
  const d = new Date(date + 'T00:00:00')
  const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
  
  return [
    `HYD - ${dateStr} - Vehicle ${route.vehicle_serial || ''}`,
    `${route.gt || ''}`,
    `${route.driver_name || ''} - ${route.vehicle_no || ''}`
  ].join('\n')
}


/* ─── Custom Select ───────────────────────────────────── */
function CustomSelect({ value, options, onChange, placeholder }: {
  value: string;
  options: { label: string, value: string }[];
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const selectedLabel = options.find(o => o.value === value)?.label || value

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-background border border-input outline-none rounded-md px-3 py-2 text-sm shadow-sm transition-all flex items-center justify-between hover:bg-muted/30 focus:border-primary focus:ring-1 focus:ring-primary text-left"
      >
        <span className={`truncate ${!value ? 'text-foreground/40' : 'text-foreground font-medium'}`}>
          {value ? selectedLabel : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-foreground/40 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 z-[100] w-full bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="max-h-48 overflow-y-auto p-1 scrollbar-none">
            <div
              onClick={() => { onChange(''); setOpen(false) }}
              className="px-2.5 py-2 text-sm text-foreground/50 hover:bg-muted hover:text-foreground rounded-md cursor-pointer transition-colors mb-0.5"
            >
              — Select —
            </div>
            {options.map(o => (
              <div 
                key={o.value} 
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`px-3 py-2.5 text-sm rounded-md cursor-pointer transition-colors ${value === o.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted font-medium'}`}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



/* ─── Route Card ─────────────────────────────────────── */
const RouteCard = memo(function RouteCard({ route, vehicles, groundTeam, selectedDate, subCategories, onUpdate, onSave, saving }: {
  route: RouteGroup; vehicles: Vehicle[]; groundTeam: GTMember[]
  selectedDate: string
  subCategories: SubCategoryOption[]
  onUpdate: (r: string, f: 'vehicle_no'|'driver_name'|'gt'|'vehicle_serial'|'gt_id'|'gt2'|'gt2_id', v: string | number | null) => void
  onSave: (r: string) => void
  saving: boolean
  allAssignedVehicles: string[]
  allAssignedDrivers: string[]
  allAssignedGTs: string[]
}) {
  const [copied, setCopied] = useState(false)

  // Sub-category icon counts
  const subCounts: Record<string, number> = {}
  for (const l of route.logs) {
    const s = l.sub_category ?? 'Other'
    subCounts[s] = (subCounts[s] ?? 0) + 1
  }

  // Filter logic
  const availableVehicles = vehicles.filter(v => v.vehicle_no === route.vehicle_no || !allAssignedVehicles.includes(v.vehicle_no))
  const allDrivers = Array.from(new Set(vehicles.map(v => v.default_driver).filter(Boolean) as string[])).sort()
  const availableDrivers = allDrivers.filter(d => d === route.driver_name || !allAssignedDrivers.includes(d))

  const availableGT1 = groundTeam.filter(m => {
    const nm = (m.name ?? '').trim()
    return nm === route.gt || (!allAssignedGTs.includes(nm) && nm !== route.gt2)
  })

  const availableGT2 = groundTeam.filter(m => {
    const nm = (m.name ?? '').trim()
    return nm === route.gt2 || (!allAssignedGTs.includes(nm) && nm !== route.gt)
  })

  const hasAssignment = route.vehicle_no || route.driver_name || route.gt || route.gt2

  return (
    <div className="h-full bg-card border border-border rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] flex flex-col snap-start snap-always scroll-mt-4">
      {/* ── TOP: Route title + ticket count + icons ── */}
      <div className="px-4 pt-4 pb-3 border-b-2 border-border rounded-t-2xl bg-muted/60 z-10 relative">
        {/* Title */}
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Route {route.route_name}
        </h2>
        <p className="text-base text-foreground/50 mt-0.5 font-medium">{route.logs.length} tickets</p>

        {/* Sub-category icon chips with v3 colors */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {Object.entries(subCounts).map(([sub, count]) => {
            const { Icon, color, bg, hexColor } = getSubIcon(sub, subCategories)
            return (
              <div key={sub} title={sub}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-semibold ${bg}`}
                style={hexColor ? { backgroundColor: hexColor + '1A', borderColor: hexColor + '33' } : {}}
              >
                <Icon size={12} className={color} style={hexColor ? { color: hexColor } : {}} />
                <span className={color} style={hexColor ? { color: hexColor } : {}}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MIDDLE: Ticket list ── */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card sticky top-0 z-10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)]">
              <th className="text-left px-4 py-2 font-medium text-foreground/50">Ticket</th>
              <th className="text-left px-2 py-2 font-medium text-foreground/50">Customer</th>
              <th className="text-right px-4 py-2 font-medium text-foreground/50">Type</th>
            </tr>
          </thead>
          <tbody>
            {route.logs.map((log) => {
              const { Icon, color, hexColor } = getSubIcon(log.sub_category ?? '', subCategories)
              return (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-sm font-medium text-foreground/60 whitespace-nowrap">
                    {log.ticket_id}
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-medium text-foreground text-base">{log.contact_name ?? '—'}</p>
                    {log.location && (
                      <p className="flex items-center gap-1 text-foreground/40 mt-1 truncate text-xs">
                        <MapPin className="w-3 h-3 shrink-0"/>{log.location}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1" title={log.sub_category ?? ''}>
                      <Icon size={13} className={color} style={hexColor ? { color: hexColor } : {}} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM: Assignment + Copy ── */}
      <div className="border-t-2 border-border bg-muted/60 px-4 py-4 rounded-b-2xl relative z-20 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.1)]">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Truck size={15} className="text-foreground/80"/>
          Assignment Details
        </h3>
        <div className="flex flex-col gap-2 mb-3">
          {/* Row 1: Serial + Vehicle */}
          <div className="grid grid-cols-2 gap-2">
            {/* Serial select */}
            <div>
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Serial No.</p>
              <input
                type="number"
                value={route.vehicle_serial || ''}
                onChange={e => onUpdate(route.route_name, 'vehicle_serial', parseInt(e.target.value) || null)}
                placeholder="1, 2..."
                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md px-3 py-2 text-sm shadow-sm transition-all placeholder:text-foreground/30"
              />
            </div>
            
            {/* Vehicle select */}
            <div className="relative">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Vehicle No.</p>
              <CustomSelect
                value={route.vehicle_no}
                onChange={v => {
                  const selected = vehicles.find(veh => veh.vehicle_no === v)
                  onUpdate(route.route_name, 'vehicle_no', v)
                  if (selected?.default_driver) onUpdate(route.route_name, 'driver_name', selected.default_driver)
                }}
                placeholder="— Select —"
                options={availableVehicles.map(v => ({ label: v.vehicle_no, value: v.vehicle_no }))}
              />
            </div>
          </div>

          {/* Row 2: Driver Name */}
          <div className="relative">
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Driver Name</p>
            <CustomSelect
              value={route.driver_name || ''}
              onChange={v => {
                const selected = vehicles.find(veh => veh.default_driver === v)
                onUpdate(route.route_name, 'driver_name', v)
                if (selected?.vehicle_no) onUpdate(route.route_name, 'vehicle_no', selected.vehicle_no)
              }}
              placeholder="— Select —"
              options={availableDrivers.map(d => ({ label: d, value: d }))}
            />
          </div>

          {/* Row 3: GT1 + GT2 */}
          <div className="grid grid-cols-2 gap-2">
            {/* GT 1 select */}
            <div className="relative">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Ground Team 1</p>
              <CustomSelect
                value={route.gt}
                onChange={v => {
                  onUpdate(route.route_name, 'gt', v)
                  const m = groundTeam.find(gtm => (gtm.name ?? '').trim() === v)
                  onUpdate(route.route_name, 'gt_id', m ? m.id : null)
                }}
                placeholder="— Select —"
                options={availableGT1.map(m => {
                  const nm = (m.name ?? '').trim()
                  return { label: nm, value: nm }
                })}
              />
            </div>
            
            {/* GT 2 select */}
            <div className="relative">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Ground Team 2</p>
              <CustomSelect
                value={route.gt2 || ''}
                onChange={v => {
                  onUpdate(route.route_name, 'gt2', v)
                  const m = groundTeam.find(gtm => (gtm.name ?? '').trim() === v)
                  onUpdate(route.route_name, 'gt2_id', m ? m.id : null)
                }}
                placeholder="— Select —"
                options={availableGT2.map(m => {
                  const nm = (m.name ?? '').trim()
                  return { label: nm, value: nm }
                })}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 mt-4">
          <button
            onClick={() => onSave(route.route_name)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? (
               <><div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse"/>Saving...</>
            ) : 'Save Data'}
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(buildRouteMsg(route, selectedDate))
              setCopied(true); setTimeout(() => setCopied(false), 2000)
            }}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold border transition-all
              ${copied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-background border-border text-foreground/70 hover:bg-muted/50 hover:border-foreground/20'
              }`}
          >
            {copied ? <Check size={13}/> : <Copy size={13}/>}
            {copied ? 'Copied to clipboard!' : 'Copy Details'}
          </button>
        </div>
      </div>
    </div>
  )
})

/* ─── Main View ──────────────────────────────────────── */
export default function SupervisorView({ selectedDate, logs, vehicles, groundTeam, subCategories, userName }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [routes, setRoutes] = useState<RouteGroup[]>(() => groupByRoute(logs))
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoutes(groupByRoute(logs))
  }, [logs])

  function handleDateChange(d: string) {
    startTransition(() => router.push(`/mobile/supervisor?date=${d}`))
  }

  const handleUpdate = useCallback((routeName: string, field: 'vehicle_no'|'driver_name'|'gt'|'vehicle_serial'|'gt_id'|'gt2'|'gt2_id', value: string | number | null) => {
    setRoutes(prev => prev.map(r => r.route_name === routeName ? { ...r, [field]: value } : r))
  }, [])

  const handleSave = useCallback(async (routeName: string) => {
    const grp = routes.find(r => r.route_name === routeName)
    if (!grp) return
    setSaving(s => ({ ...s, [routeName]: true }))
    
    const dbSerial = grp.vehicle_serial
    await updateDispatchLogs(grp.logs.map(l => l.id), {
      vehicle_serial: dbSerial,
      vehicle_no: grp.vehicle_no || null,
      driver_name: grp.driver_name || null,
      gt: grp.gt || null,
      gt_id: grp.gt_id || null,
      gt2: grp.gt2 || null,
      gt2_id: grp.gt2_id || null
    })
    
    setSaving(s => ({ ...s, [routeName]: false }))
  }, [routes])

  async function handleSignOut() {
    const { createClient } = await import('@/utils/supabase/client')
    await createClient().auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">

      {/* ── Header ── */}
      <header className="shrink-0 bg-card border-b border-border shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] px-4 pt-4 pb-3">
        {/* Row 1: App Info + User */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white/10">
              <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block text-lg font-bold text-foreground leading-none">Warehouse OPs</span>
              <span className="block text-sm text-foreground/50 mt-1.5 font-medium">{userName.split(' ')[0]}</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
        {/* Row 2: Date Picker + Count */}
        <div className="flex items-center justify-between mb-3">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <span className="text-sm font-semibold text-foreground/50 bg-foreground/[0.06] border border-foreground/10 px-3 py-1 rounded-full tabular-nums">
            {routes.length} {routes.length === 1 ? 'route' : 'routes'}
          </span>
        </div>
        {/* Row 3: Search */}
        <div>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search tickets or names..." 
          />
        </div>
      </header>

      {routes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] flex items-center justify-center mb-3">
            <Truck className="w-5 h-5 text-foreground/20"/>
          </div>
          <p className="text-sm font-medium text-foreground/40">No routes for this date</p>
          <p className="text-xs text-foreground/30 mt-1">Routes appear once dispatch is planned</p>
        </div>
      ) : (
        <>
          {/* ── Scrollable Cards ── */}
          <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-none p-3 gap-3">
            {(() => {
              const allAssignedVehicles = routes.map(r => r.vehicle_no).filter(Boolean)
              const allAssignedDrivers = routes.map(r => r.driver_name).filter(Boolean)
              const allAssignedGTs = routes.flatMap(r => [r.gt, r.gt2]).filter(Boolean)

              return routes
                .map(r => {
                  if (!searchQuery) return r
                  const q = searchQuery.toLowerCase()
                  const matchLogs = r.logs.filter(l => 
                    l.ticket_id?.toLowerCase().includes(q) || 
                    l.contact_name?.toLowerCase().includes(q)
                  )
                  if (matchLogs.length > 0 || r.route_name.toLowerCase().includes(q) || r.driver_name?.toLowerCase().includes(q) || r.vehicle_no?.toLowerCase().includes(q)) {
                    return { ...r, logs: matchLogs.length > 0 ? matchLogs : r.logs }
                  }
                  return null
                })
                .filter(Boolean)
                .map(r => r!)
                .map(r => (
                <div key={r.route_name} className="w-[calc(100vw-24px)] shrink-0 snap-center snap-always h-full">
                  <RouteCard 
                    key={r.route_name} 
                    route={r} 
                    vehicles={vehicles} 
                    groundTeam={groundTeam} 
                    selectedDate={selectedDate}
                    subCategories={subCategories}
                    onUpdate={handleUpdate}
                    onSave={handleSave}
                    saving={saving[r.route_name] || false}
                    allAssignedVehicles={allAssignedVehicles}
                    allAssignedDrivers={allAssignedDrivers}
                    allAssignedGTs={allAssignedGTs}
                  />
                </div>
              ))
            })()}
          </div>
        </>
      )}
    </div>
  )
}
