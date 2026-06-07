import React from 'react'
import {
  Truck, PackageOpen, PackageMinus, ArrowRightLeft,
  ArrowUpCircle, RefreshCw, Wrench, Hammer, AlertTriangle, HelpCircle
} from 'lucide-react'
import type { SubCategoryOption } from '@/types/models'

export const IconMap: Record<string, React.ElementType> = {
  Truck, PackageOpen, PackageMinus, ArrowRightLeft,
  ArrowUpCircle, RefreshCw, Wrench, Hammer, AlertTriangle, HelpCircle
}

export const ColorMap: Record<string, { color: string; bg: string }> = {
  blue: { color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  purple: { color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
  red: { color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  teal: { color: 'text-teal-500', bg: 'bg-teal-50 border-teal-200' },
  green: { color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
  orange: { color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  yellow: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  indigo: { color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
  primary: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20' }
}

export function getSubIcon(sub: string, options: SubCategoryOption[]): { Icon: React.ElementType; color: string; bg: string; hexColor?: string } {
  const s = (sub || '').toLowerCase()
  
  const match = options.find(o => s.includes(o.name.toLowerCase()))
  if (match) {
    const Icon = IconMap[match.icon] || HelpCircle
    if (match.color.startsWith('#')) {
      return { Icon, color: '', bg: '', hexColor: match.color }
    }
    const colors = ColorMap[match.color.toLowerCase()] || ColorMap.primary
    return { 
      Icon, 
      color: colors.color, 
      bg: colors.bg
    }
  }

  // Hardcoded Fallback if DB is empty or unmapped
  if (s.includes('delivery'))         return { Icon: Truck,          color: 'text-blue-500',    bg: 'bg-blue-50 border-blue-200' }
  if (s.includes('partial pickup'))   return { Icon: PackageMinus,   color: 'text-purple-400',  bg: 'bg-purple-50 border-purple-200' }
  if (s.includes('defaulter pickup')) return { Icon: AlertTriangle,  color: 'text-red-500',     bg: 'bg-red-50 border-red-200' }
  if (s.includes('pickup'))           return { Icon: PackageOpen,    color: 'text-purple-500',  bg: 'bg-purple-50 border-purple-200' }
  if (s.includes('relocation'))       return { Icon: ArrowRightLeft, color: 'text-teal-500',    bg: 'bg-teal-50 border-teal-200' }
  if (s.includes('upgrade'))          return { Icon: ArrowUpCircle,  color: 'text-green-500',   bg: 'bg-green-50 border-green-200' }
  if (s.includes('replacement'))      return { Icon: RefreshCw,      color: 'text-orange-500',  bg: 'bg-orange-50 border-orange-200' }
  if (s.includes('repair'))           return { Icon: Wrench,         color: 'text-yellow-600',  bg: 'bg-yellow-50 border-yellow-200' }
  if (s.includes('installation'))     return { Icon: Hammer,         color: 'text-indigo-500',  bg: 'bg-indigo-50 border-indigo-200' }

  // Ultimate fallback
  return { Icon: HelpCircle, color: 'text-muted-foreground', bg: 'bg-muted border-border' }
}
