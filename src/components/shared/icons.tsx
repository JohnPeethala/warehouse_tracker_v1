import React from 'react'
import {
  Truck, PackageOpen, PackageMinus, ArrowRightLeft,
  ArrowUpCircle, RefreshCw, Wrench, Hammer, AlertTriangle, HelpCircle
} from 'lucide-react'

export function getSubIcon(sub: string): { Icon: React.ElementType; color: string; bg: string } {
  const s = (sub || '').toLowerCase()
  if (s.includes('delivery'))         return { Icon: Truck,          color: 'text-blue-500',    bg: 'bg-blue-50 border-blue-200' }
  if (s.includes('partial pickup'))   return { Icon: PackageMinus,   color: 'text-purple-400',  bg: 'bg-purple-50 border-purple-200' }
  if (s.includes('defaulter pickup')) return { Icon: AlertTriangle,  color: 'text-red-500',     bg: 'bg-red-50 border-red-200' }
  if (s.includes('pickup'))           return { Icon: PackageOpen,    color: 'text-purple-500',  bg: 'bg-purple-50 border-purple-200' }
  if (s.includes('relocation'))       return { Icon: ArrowRightLeft, color: 'text-teal-500',    bg: 'bg-teal-50 border-teal-200' }
  if (s.includes('upgrade'))          return { Icon: ArrowUpCircle,  color: 'text-green-500',   bg: 'bg-green-50 border-green-200' }
  if (s.includes('replacement'))      return { Icon: RefreshCw,      color: 'text-orange-500',  bg: 'bg-orange-50 border-orange-200' }
  if (s.includes('repair'))           return { Icon: Wrench,         color: 'text-yellow-600',  bg: 'bg-yellow-50 border-yellow-200' }
  if (s.includes('installation'))     return { Icon: Hammer,         color: 'text-indigo-500',  bg: 'bg-indigo-50 border-indigo-200' }
  return { Icon: HelpCircle, color: 'text-muted-foreground', bg: 'bg-muted border-border' }
}
