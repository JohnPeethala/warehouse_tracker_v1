'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { getQueue, removeFromQueue } from '@/services/offlineSync'
import { updateDispatchLogs, updateTicketStatus } from '@/services/database'

export function OfflineSyncIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  // Initial check & Listeners
  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => {
      setIsOffline(false)
      flushQueue()
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Check queue periodically when offline to update count
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        const q = await getQueue()
        setQueueCount(q.length)
      }
    }, 2000)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
    }
  }, [])

  async function flushQueue() {
    setSyncing(true)
    const queue = await getQueue()
    
    for (const item of queue) {
      if (!item.id) continue
      try {
        if (item.action === 'update_dispatch_logs') {
          await updateDispatchLogs(item.payload.logIds, item.payload.updates, true)
        } else if (item.action === 'update_ticket_status') {
          await updateTicketStatus(item.payload.logId, item.payload.updates, true)
        }
        // If it successfully sent, remove from queue
        await removeFromQueue(item.id)
      } catch (err) {
        console.error('Failed to sync offline item', err)
      }
    }
    
    setQueueCount(0)
    setSyncing(false)
  }

  if (!isOffline && !syncing && queueCount === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg border backdrop-blur-md font-medium text-xs pointer-events-auto transition-all ${
        syncing 
          ? 'bg-blue-500/90 text-white border-blue-600'
          : isOffline 
            ? 'bg-amber-500/90 text-white border-amber-600'
            : 'bg-emerald-500/90 text-white border-emerald-600'
      }`}>
        {syncing ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            <span>Syncing {queueCount > 0 ? `${queueCount} items` : 'changes'}...</span>
          </>
        ) : isOffline ? (
          <>
            <WifiOff size={14} />
            <span>Offline. {queueCount > 0 ? `${queueCount} changes saved locally.` : ''}</span>
          </>
        ) : (
          <span>Back online!</span>
        )}
      </div>
    </div>
  )
}
