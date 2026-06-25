import { useState } from 'react'
import { MapPin, Check, Copy, ChevronDown } from 'lucide-react'
import { getSubIcon } from '@/components/shared/icons'

import type { Log, GTStatusOption, DTStatusOption, SubCategoryOption } from '@/types/models'

export function getStatusColor(statusName: string | null | undefined, options: GTStatusOption[]) {
  if (!statusName) return { bannerClass: 'bg-primary', badgeClass: '', hexColor: null }
  const opt = options.find(o => o.name === statusName)
  const c = opt ? opt.color : 'primary'
  
  if (c.startsWith('#')) {
    return { bannerClass: '', badgeClass: '', hexColor: c }
  }
  
  if (c === 'emerald') return { bannerClass: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200', hexColor: null }
  if (c === 'blue') return { bannerClass: 'bg-blue-500', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200', hexColor: null }
  if (c === 'rose') return { bannerClass: 'bg-rose-500', badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200', hexColor: null }
  if (c === 'amber') return { bannerClass: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200', hexColor: null }
  
  return { bannerClass: `bg-${c}-500`, badgeClass: `bg-${c}-50 text-${c}-700 border border-${c}-200`, hexColor: null }
}

export function TicketCard({ log, index, statusOptions, dtStatusOptions, subCategories, onSave, isSaving, isSelected, onSelect, onClose }: { 
  log: Log, index: number, statusOptions: GTStatusOption[], dtStatusOptions: DTStatusOption[], subCategories: SubCategoryOption[], 
  onSave: (status: string, remarks: string, dtStatus: string | null, withLocation: boolean) => void,
  isSaving?: boolean, isSelected?: boolean, onSelect?: () => void, onClose?: () => void 
}) {
  const [open, setOpen] = useState(false)
  const [openDt, setOpenDt] = useState(false)
  const [status, setStatus] = useState(log.gt_status || '')
  const [dtStatus, setDtStatus] = useState(log.dt_status || '')
  const [remarks, setRemarks] = useState(log.remarks || '')
  const [copied, setCopied] = useState(false)

  const colors = getStatusColor(log.gt_status, statusOptions)
  const dtCardColors = getStatusColor(log.dt_status, dtStatusOptions)
  const currentColors = getStatusColor(status, statusOptions)
  const dtColors = getStatusColor(dtStatus, dtStatusOptions)
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
    <>
    <div 
      className="bg-card border border-border rounded-lg shadow-sm cursor-pointer hover:border-primary/50 transition-all group overflow-hidden relative"
      onClick={onSelect}
    >
      {isSaving && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
        </div>
      )}

      {/* Top Banner (Status indicator) */}
      <div 
        className={`h-1.5 w-full rounded-t-lg ${colors.bannerClass}`} 
        style={colors.hexColor ? { backgroundColor: colors.hexColor } : {}}
      />
      
      {/* Top Header */}
      <div className="px-4 py-3 bg-muted/20 border-b border-border flex flex-col transition-colors group-hover:bg-muted/40">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
              <span className="truncate max-w-[180px]">{log.contact_name || 'No Name'}</span>
              <span className="text-sm font-normal text-foreground/40 shrink-0">#{log.ticket_id}</span>
            </h3>
          </div>
          <div className="text-right flex flex-col items-end gap-1.5">
            <div 
              className={`flex items-center gap-1.5 px-2 py-1 rounded border ${subBg}`} 
              title={log.sub_category || 'Other'}
              style={hexColor ? { backgroundColor: hexColor + '1A', borderColor: hexColor + '33' } : {}}
            >
              <SubIcon size={12} className={subColor} style={hexColor ? { color: hexColor } : {}} />
              <span 
                className={`text-xs font-bold uppercase tracking-wider ${subColor}`}
                style={hexColor ? { color: hexColor } : {}}
              >
                {log.sub_category || 'Other'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium mt-1">
          <div className="flex items-center gap-1.5">
            <span 
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors.badgeClass}`}
              style={colors.hexColor ? { backgroundColor: colors.hexColor + '1A', borderColor: colors.hexColor + '33', color: colors.hexColor } : {}}
            >
              GT: {log.gt_status || 'Pending'}
            </span>
          </div>
          {log.dt_status && (
            <div className="flex items-center gap-1.5 border-l border-border/50 pl-3">
              <span 
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${dtCardColors.badgeClass}`}
                style={dtCardColors.hexColor ? { backgroundColor: dtCardColors.hexColor + '1A', borderColor: dtCardColors.hexColor + '33', color: dtCardColors.hexColor } : {}}
              >
                DT: {log.dt_status}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-card pointer-events-none">
        <div className="flex items-start gap-1.5 text-sm text-foreground/60 bg-muted/30 p-2 rounded-md border border-border/50">
          <MapPin size={14} className="mt-0.5 shrink-0 text-foreground/40"/>
          <span className="leading-snug">{log.location || 'No location provided'}</span>
        </div>
      </div>
    </div>

    {/* Expanded Bottom Sheet Modal View */}
    {isSelected && (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={onClose}
        />
        
        {/* Bottom Sheet Content */}
        <div className="relative bg-background rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh] w-full animate-in slide-in-from-bottom-full duration-300 border-t border-border">
          {/* Handle (Visual cue for pull-down) */}
          <div className="shrink-0 flex justify-center pt-3 pb-1 w-full bg-card rounded-t-2xl" onClick={onClose}>
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Header */}
          <div className="shrink-0 px-4 pb-4 pt-1 border-b border-border bg-card flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground leading-none">{log.contact_name || 'No Name'}</h2>
              <p className="text-sm text-foreground/50 mt-1 font-medium">Ticket #{log.ticket_id}</p>
            </div>
          <button 
            onClick={onClose}
            className="p-2 bg-muted/50 text-foreground/60 rounded-md hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto min-h-0 bg-muted/10 p-4 space-y-4 pb-8">
          <div className="flex items-start gap-1.5 text-sm text-foreground/60 bg-card p-3 rounded-md border border-border/50 shadow-sm">
            <MapPin size={14} className="mt-0.5 shrink-0 text-foreground/40"/>
            <span className="leading-snug">{log.location || 'No location provided'}</span>
          </div>

          {/* Action Form */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-4 relative z-20">
          <div className="relative">
             <label className="text-xs font-medium text-foreground/40 uppercase tracking-wide mb-1.5 block">Update Status</label>
             <button 
               onClick={() => setOpen(!open)}
               className={`w-full border rounded-md px-3 py-2.5 text-sm shadow-sm flex items-center justify-between font-medium text-left transition-colors ${
                 status ? currentColors.badgeClass : 'bg-background border-input text-foreground/40 hover:bg-muted'
               }`}
               style={status && currentColors.hexColor ? { backgroundColor: currentColors.hexColor + '1A', borderColor: currentColors.hexColor + '33', color: currentColors.hexColor } : {}}
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
                       className={`px-3 py-2.5 text-sm rounded-md cursor-pointer flex items-center justify-between ${status === opt.name ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted font-medium'}`}
                     >
                       <span>{opt.name}</span>
                       <div 
                         className={`w-2 h-2 rounded-full ${
                           !opt.color.startsWith('#') ? (
                             opt.color === 'emerald' ? 'bg-emerald-500' : 
                             opt.color === 'blue' ? 'bg-blue-500' : 
                             opt.color === 'rose' ? 'bg-rose-500' : 
                             opt.color === 'amber' ? 'bg-amber-500' : 'bg-primary'
                           ) : ''
                         }`} 
                         style={opt.color.startsWith('#') ? { backgroundColor: opt.color } : {}}
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>

          <div className="relative">
             <label className="text-xs font-medium text-foreground/40 uppercase tracking-wide mb-1.5 block">Update DT Status</label>
             <button 
               onClick={() => setOpenDt(!openDt)}
               className={`w-full border rounded-md px-3 py-2.5 text-sm shadow-sm flex items-center justify-between font-medium text-left transition-colors ${
                 dtStatus ? dtColors.badgeClass : 'bg-background border-input text-foreground/40 hover:bg-muted'
               }`}
               style={dtStatus && dtColors.hexColor ? { backgroundColor: dtColors.hexColor + '1A', borderColor: dtColors.hexColor + '33', color: dtColors.hexColor } : {}}
             >
               <span>
                 {dtStatus || '— Select DT Status —'}
               </span>
               <ChevronDown size={14} className={dtStatus ? '' : 'text-foreground/40'}/>
             </button>

             {openDt && (
               <div className="absolute top-full left-0 mt-1 z-[100] w-full bg-card border border-border rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="p-1">
                   {dtStatusOptions.map(opt => (
                     <div 
                       key={opt.name}
                       onClick={() => { setDtStatus(opt.name); setOpenDt(false) }}
                       className={`px-3 py-2.5 text-sm rounded-md cursor-pointer flex items-center justify-between ${dtStatus === opt.name ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted font-medium'}`}
                     >
                       <span>{opt.name}</span>
                       <div 
                         className={`w-2 h-2 rounded-full ${
                           !opt.color.startsWith('#') ? (
                             opt.color === 'emerald' ? 'bg-emerald-500' : 
                             opt.color === 'blue' ? 'bg-blue-500' : 
                             opt.color === 'rose' ? 'bg-rose-500' : 
                             opt.color === 'amber' ? 'bg-amber-500' : 'bg-primary'
                           ) : ''
                         }`} 
                         style={opt.color.startsWith('#') ? { backgroundColor: opt.color } : {}}
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>

          <div>
             <label className="text-xs font-medium text-foreground/40 uppercase tracking-wide mb-1.5 block">Remarks</label>
             <div className="relative">
               <input 
                 type="text" 
                 value={remarks}
                 onChange={e => setRemarks(e.target.value)}
                 placeholder="Enter remarks..."
                 className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-md px-3 py-2.5 text-sm shadow-sm transition-all"
               />
             </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button 
              onClick={() => onSave(status, remarks, dtStatus, false)}
              disabled={!status || (status === log.gt_status && remarks === log.remarks && dtStatus === log.dt_status)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Check size={18}/>
              Save Update
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onSave(status, remarks, dtStatus, true)}
                disabled={!status || (status === log.gt_status && remarks === log.remarks && dtStatus === log.dt_status)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border-2 border-primary/20 bg-primary/5 text-primary shadow-sm hover:bg-primary/10 transition-all disabled:opacity-50"
              >
                <MapPin size={16}/>
                Locate
              </button>
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                {copied ? <Check size={16}/> : <Copy size={16}/>}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    )}
    </>
  )
}
