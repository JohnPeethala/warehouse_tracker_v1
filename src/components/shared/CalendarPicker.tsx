import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function CalendarPicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => new Date(value + 'T00:00:00'))
  const today = toYMD(new Date())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])
  
  const y = view.getFullYear(), m = view.getMonth()
  const d = new Date(value + 'T00:00:00')
  
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]">
        <Calendar className="w-3.5 h-3.5 text-foreground/50" />
        {DAYS[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}
        <ChevronRight className={`w-3.5 h-3.5 text-foreground/30 ml-0.5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-[260px] bg-card border border-border rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-3 px-1">
            <button onClick={() => setView(new Date(y,m-1,1))} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft size={16}/></button>
            <span className="text-sm font-bold tracking-tight">{MONTH_FULL[m]} {y}</span>
            <button onClick={() => setView(new Date(y,m+1,1))} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight size={16}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
            {DAY_ABBR.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: new Date(y,m,1).getDay()}).map((_,i) => <div key={i}/>)}
            {Array.from({length: new Date(y,m+1,0).getDate()}, (_,i) => i+1).map(day => {
              const ymd = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const sel = ymd === value, tdy = ymd === today
              return (
                <button key={day} onClick={() => { onChange(ymd); setOpen(false) }}
                  className={`aspect-square flex items-center justify-center text-sm rounded-md font-medium transition-all
                    ${sel ? 'bg-primary text-primary-foreground shadow-md' : tdy ? 'ring-1 ring-foreground/20' : 'hover:bg-muted'}`}>
                  {day}
                </button>
              )
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-border flex justify-end">
            <button onClick={() => { onChange(today); setOpen(false) }} className="text-xs font-medium text-muted-foreground hover:text-foreground">Today</button>
          </div>
        </div>
      )}
    </div>
  )
}
