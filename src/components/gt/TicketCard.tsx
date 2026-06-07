import { useState } from 'react'
import { MapPin, Check, Copy, ChevronDown } from 'lucide-react'
import { getSubIcon } from '@/components/shared/icons'

import type { Log, GTStatusOption, SubCategoryOption } from '@/types/models'

export function getStatusColor(statusName: string | null | undefined, options: GTStatusOption[]) {
  if (!statusName) return { banner: 'bg-primary', badge: '' }
  const opt = options.find(o => o.name === statusName)
  const c = opt ? opt.color : 'primary'
  
  if (c === 'emerald') return { banner: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  if (c === 'blue') return { banner: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border border-blue-200' }
  if (c === 'rose') return { banner: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border border-rose-200' }
  if (c === 'amber') return { banner: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border border-amber-200' }
  
  return { banner: `bg-${c}-500`, badge: `bg-${c}-50 text-${c}-700 border border-${c}-200` }
}

export function TicketCard({ log, index, statusOptions, subCategories, onSave, isSaving }: { log: Log, index: number, statusOptions: GTStatusOption[], subCategories: SubCategoryOption[], onSave: (s: string, r: string) => void, isSaving: boolean }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(log.gt_status || '')
  const [remarks, setRemarks] = useState(log.remarks || '')
  const [copied, setCopied] = useState(false)

  const colors = getStatusColor(log.gt_status, statusOptions)
  const currentColors = getStatusColor(status, statusOptions)
  const { Icon: SubIcon, color: subColor, bg: subBg, hexColor } = getSubIcon(log.sub_category || '', subCategories)

  function handleCopy() {
    const lines = [
      `${log.ticket_id} - ${log.contact_name || 'No Name'}`,
      `${log.sub_category || 'Other'} - ${log.gt_status || 'Pending'}${log.remarks ? ` - ${log.remarks}` : ''}`
    ]
    if (log.gt_maps_link) lines.push(log.gt_maps_link)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] transition-all relative">
      {isSaving && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
          <span className="text-xs font-medium text-primary">Capturing Location...</span>
        </div>
      )}

      {/* Top Banner (Status indicator) */}
      <div className={`h-1.5 w-full rounded-t-xl ${colors.banner}`} />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="truncate max-w-[160px]">{log.contact_name || 'No Name'}</span>
              <span className="text-xs font-normal text-foreground/40 shrink-0">#{log.ticket_id}</span>
            </h3>
          </div>
          <div className="text-right flex flex-col items-end gap-1.5">
            <div 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${subBg}`} 
              title={log.sub_category || 'Other'}
              style={hexColor ? { backgroundColor: hexColor + '1A', borderColor: hexColor + '33' } : {}}
            >
              <SubIcon size={12} className={subColor} style={hexColor ? { color: hexColor } : {}} />
              <span 
                className={`text-[10px] font-bold uppercase tracking-wider ${subColor}`}
                style={hexColor ? { color: hexColor } : {}}
              >
                {log.sub_category || 'Other'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-xs text-foreground/60 mb-4 bg-muted/30 p-2 rounded-lg border border-border/50">
          <MapPin size={14} className="mt-0.5 shrink-0 text-foreground/40"/>
          <span className="leading-snug">{log.location || 'No location provided'}</span>
        </div>

        {/* Action Form */}
        <div className="bg-foreground/[0.02] border border-border rounded-lg p-3 space-y-3">
          <div className="relative">
             <label className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1 block">Update Status</label>
             <button 
               onClick={() => setOpen(!open)}
               className={`w-full border rounded-md px-2.5 py-2 text-xs shadow-sm flex items-center justify-between font-medium text-left transition-colors ${
                 status ? currentColors.badge : 'bg-background border-input text-foreground/40 hover:bg-muted'
               }`}
             >
               <span>
                 {status || '— Select Status —'}
               </span>
               <ChevronDown size={14} className={status ? '' : 'text-foreground/40'}/>
             </button>

             {open && (
               <div className="absolute top-full left-0 mt-1 z-[100] w-full bg-card border border-border rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="p-1">
                   {statusOptions.map(opt => (
                     <div 
                       key={opt.name}
                       onClick={() => { setStatus(opt.name); setOpen(false) }}
                       className={`px-2.5 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between ${status === opt.name ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted font-medium'}`}
                     >
                       <span>{opt.name}</span>
                       <div className={`w-2 h-2 rounded-full ${
                         opt.color === 'emerald' ? 'bg-emerald-500' : 
                         opt.color === 'blue' ? 'bg-blue-500' : 
                         opt.color === 'rose' ? 'bg-rose-500' : 
                         opt.color === 'amber' ? 'bg-amber-500' : 'bg-primary'
                       }`} />
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>

          <div>
             <label className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide mb-1 block">Remarks</label>
             <div className="relative">
               <input 
                 type="text" 
                 value={remarks}
                 onChange={e => setRemarks(e.target.value)}
                 placeholder="Enter remarks..."
                 className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md px-2.5 py-2 text-xs shadow-sm transition-all"
               />
             </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onSave(status, remarks)}
              disabled={!status || (status === log.gt_status && remarks === log.remarks)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Check size={14}/>
              Submit
            </button>
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-background border-border text-foreground hover:bg-muted'
              }`}
            >
              {copied ? <Check size={14}/> : <Copy size={14}/>}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
