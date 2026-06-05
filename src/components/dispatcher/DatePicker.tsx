'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function DatePicker({ selectedDate }: { selectedDate: string }) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const baseDate = new Date(selectedDate)
  // Ensure we don't get time zone shift bugs by using UTC or keeping hours at noon
  baseDate.setHours(12, 0, 0, 0)

  const days = Array.from({ length: 15 }).map((_, i) => {
    const d = new Date(baseDate.getTime())
    d.setDate(d.getDate() - 7 + i)
    return d
  })

  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]') as HTMLElement
      if (selectedEl) {
        scrollRef.current.scrollTo({
          left: selectedEl.offsetLeft - scrollRef.current.offsetWidth / 2 + selectedEl.offsetWidth / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedDate])

  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' })

  const todayStr = formatDate(new Date())

  return (
    <div className="w-full">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((date, idx) => {
          const dateStr = formatDate(date)
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr

          return (
            <button
              key={idx}
              data-selected={isSelected}
              onClick={() => router.push(`/mobile/dispatcher?date=${dateStr}`)}
              className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl snap-center transition-all ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={`text-xs font-medium uppercase tracking-wider mb-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                {getDayName(date)}
              </span>
              <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {date.getDate()}
              </span>
              {isToday && !isSelected && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
