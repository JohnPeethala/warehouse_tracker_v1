'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Calendar, LogOut,
  Truck, PackageOpen, PackageMinus, ArrowRightLeft,
  ArrowUpCircle, RefreshCw, Wrench, Hammer, AlertTriangle,
  HelpCircle, User, Copy, Check, MapPin
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { CalendarPicker } from '@/components/shared/CalendarPicker'
import { getSubIcon } from '@/components/shared/icons'

/* ─── Types ─────────────────────────────────────────── */
type Log = {
  id: string; ticket_id: string; route_name: string | null
  vehicle_no: string | null; driver_name: string | null; gt: string | null
  vehicle_serial: number | null
  contact_name: string | null; location: string | null
  sub_category: string | null; ticket_status: string | null; notes: string | null
}
type Vehicle  = { id: string; vehicle_no: string; default_driver: string | null }
type GTMember = { id: string; first_name: string; last_name: string }
type RouteGroup = {
  route_name: string; logs: Log[]
  vehicle_no: string; driver_name: string; gt: string
  vehicle_serial: number | null
}
type Props = {
  selectedDate: string; logs: Log[]
  vehicles: Vehicle[]; groundTeam: GTMember[]; userName: string
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

const statusCfg: Record<string,string> = {
  'Delivered': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Issue':     'text-rose-700 bg-rose-50 border-rose-200',
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
        className="w-full bg-background border border-input outline-none rounded-md px-2 py-1.5 text-xs shadow-sm transition-all flex items-center justify-between hover:bg-muted/30 focus:border-primary focus:ring-1 focus:ring-primary text-left"
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
              className="px-2.5 py-2 text-xs text-foreground/50 hover:bg-muted hover:text-foreground rounded-md cursor-pointer transition-colors mb-0.5"
            >
              — Select —
            </div>
            {options.map(o => (
              <div 
                key={o.value} 
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`px-2.5 py-2 text-xs rounded-md cursor-pointer transition-colors ${value === o.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted font-medium'}`}
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
function RouteCard({ route, vehicles, groundTeam, selectedDate, onUpdate, onSave, saving }: {
  route: RouteGroup; vehicles: Vehicle[]; groundTeam: GTMember[]
  selectedDate: string
  onUpdate: (r: string, f: 'vehicle_no'|'driver_name'|'gt'|'vehicle_serial', v: any) => void
  onSave: (r: string) => void
  saving: boolean
}) {
  const [copied, setCopied] = useState(false)

  // Sub-category icon counts
  const subCounts: Record<string, number> = {}
  for (const l of route.logs) {
    const s = l.sub_category ?? 'Other'
    subCounts[s] = (subCounts[s] ?? 0) + 1
  }

  const hasAssignment = route.vehicle_no || route.driver_name || route.gt

  return (
    <div className="h-full bg-card border border-border rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] flex flex-col">
      {/* ── TOP: Route title + ticket count + icons ── */}
      <div className="px-4 pt-4 pb-3 border-b border-border rounded-t-2xl bg-card z-10">
        {/* Title */}
        <h2 className="text-base font-bold text-foreground tracking-tight">
          Route {route.route_name}
        </h2>
        <p className="text-xs text-foreground/50 mt-0.5 font-medium">{route.logs.length} tickets</p>

        {/* Sub-category icon chips with v3 colors */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {Object.entries(subCounts).map(([sub, count]) => {
            const { Icon, color, bg } = getSubIcon(sub)
            return (
              <div key={sub} title={sub}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${bg}`}>
                <Icon size={12} className={color} />
                <span className={color}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MIDDLE: Ticket list ── */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-foreground/5 sticky top-0">
              <th className="text-left px-4 py-2 font-medium text-foreground/50">Ticket</th>
              <th className="text-left px-2 py-2 font-medium text-foreground/50">Customer</th>
              <th className="text-right px-4 py-2 font-medium text-foreground/50">Type</th>
            </tr>
          </thead>
          <tbody>
            {route.logs.map((log) => {
              const { Icon, color } = getSubIcon(log.sub_category ?? '')
              return (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-foreground/60 whitespace-nowrap">
                    {log.ticket_id}
                  </td>
                  <td className="px-2 py-2.5">
                    <p className="font-medium text-foreground">{log.contact_name ?? '—'}</p>
                    {log.location && (
                      <p className="flex items-center gap-0.5 text-foreground/40 mt-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0"/>{log.location}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1" title={log.sub_category ?? ''}>
                      <Icon size={13} className={color} />
                      {log.ticket_status && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wider ${statusCfg[log.ticket_status] ?? 'text-foreground/40 bg-muted border-border'}`}>
                          {log.ticket_status === 'Delivered' ? '✓' : log.ticket_status === 'Issue' ? '!' : log.ticket_status}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── BOTTOM: Assignment + Copy ── */}
      <div className="border-t border-border bg-foreground/[0.02] px-4 py-3 rounded-b-2xl relative z-20">
        <div className="flex flex-col gap-2 mb-2.5">
          {/* Row 1: Serial + GT */}
          <div className="grid grid-cols-2 gap-2">
            {/* Serial select */}
            <div>
              <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Serial No.</p>
              <input
                type="number"
                value={route.vehicle_serial || ''}
                onChange={e => onUpdate(route.route_name, 'vehicle_serial', parseInt(e.target.value) || null)}
                placeholder="1, 2..."
                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md px-2 py-1.5 text-xs shadow-sm transition-all placeholder:text-foreground/30"
              />
            </div>
            
            {/* GT select */}
            <div className="relative">
              <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Ground Team</p>
              <CustomSelect
                value={route.gt}
                onChange={v => onUpdate(route.route_name, 'gt', v)}
                placeholder="— Select —"
                options={groundTeam.map(m => {
                  const nm = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim()
                  return { label: nm, value: nm }
                })}
              />
            </div>
          </div>

          {/* Row 2: Vehicle No + Driver Name */}
          <div className="grid grid-cols-2 gap-2">
            {/* Vehicle select */}
            <div className="relative">
              <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Vehicle No.</p>
              <CustomSelect
                value={route.vehicle_no}
                onChange={v => {
                  const selected = vehicles.find(veh => veh.vehicle_no === v)
                  onUpdate(route.route_name, 'vehicle_no', v)
                  if (selected?.default_driver) onUpdate(route.route_name, 'driver_name', selected.default_driver)
                }}
                placeholder="— Select —"
                options={vehicles.map(v => ({ label: v.vehicle_no, value: v.vehicle_no }))}
              />
            </div>

            {/* Driver Name */}
            <div className="relative">
              <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1">Driver Name</p>
              <CustomSelect
                value={route.driver_name || ''}
                onChange={v => {
                  const selected = vehicles.find(veh => veh.default_driver === v)
                  onUpdate(route.route_name, 'driver_name', v)
                  if (selected?.vehicle_no) onUpdate(route.route_name, 'vehicle_no', selected.vehicle_no)
                }}
                placeholder="— Select —"
                options={Array.from(new Set(vehicles.map(v => v.default_driver).filter(Boolean) as string[])).sort().map(d => ({ label: d, value: d }))}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-3">
          <button
            onClick={() => onSave(route.route_name)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
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
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all
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
}

/* ─── Main View ──────────────────────────────────────── */
export default function SupervisorView({ selectedDate, logs, vehicles, groundTeam, userName }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [routes, setRoutes] = useState<RouteGroup[]>(() => groupByRoute(logs))
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setRoutes(groupByRoute(logs))
  }, [logs])

  function handleDateChange(d: string) {
    startTransition(() => router.push(`/mobile/supervisor?date=${d}`))
  }

  function handleUpdate(routeName: string, field: 'vehicle_no'|'driver_name'|'gt'|'vehicle_serial', value: any) {
    setRoutes(prev => prev.map(r => r.route_name === routeName ? { ...r, [field]: value } : r))
  }

  async function handleSave(routeName: string) {
    const grp = routes.find(r => r.route_name === routeName)
    if (!grp) return
    setSaving(s => ({ ...s, [routeName]: true }))
    
    const dbSerial = grp.vehicle_serial
    await createClient().from('dispatch_log').update({
      vehicle_serial: dbSerial,
      vehicle_no: grp.vehicle_no || null,
      driver_name: grp.driver_name || null,
      gt: grp.gt || null
    }).in('id', grp.logs.map(l => l.id))
    
    setSaving(s => ({ ...s, [routeName]: false }))
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">

      {/* ── Header ── */}
      <header className="shrink-0 bg-card border-b border-border shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] px-4 pt-12 pb-3">
        {/* Row 1: App Info + User */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm overflow-hidden bg-white/10">
              <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block text-sm font-bold text-foreground leading-none">Warehouse OPs</span>
              <span className="block text-[10px] text-foreground/50 mt-0.5 font-medium">{userName.split(' ')[0]}</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
        {/* Row 2: Date Picker + Count */}
        <div className="flex items-center justify-between">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />
          <span className="text-xs font-medium text-foreground/50 bg-foreground/[0.06] border border-foreground/10 px-2.5 py-1 rounded-full tabular-nums">
            {routes.length} {routes.length === 1 ? 'route' : 'routes'}
          </span>
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
            {routes.map(route => (
              <div key={route.route_name} className="w-[calc(100vw-24px)] shrink-0 snap-center h-full">
                <RouteCard
                  route={route}
                  vehicles={vehicles}
                  groundTeam={groundTeam}
                  selectedDate={selectedDate}
                  onUpdate={handleUpdate}
                  onSave={handleSave}
                  saving={!!saving[route.route_name]}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
