import { createClient } from '@/utils/supabase/client'
import { addToQueue } from '@/services/offlineSync'

export async function updateDispatchLogs(logIds: string[], updates: {
  vehicle_serial?: number | null
  vehicle_no?: string | null
  driver_name?: string | null
  gt?: string | null
}, isSync = false) {
  if (!isSync && typeof window !== 'undefined' && !navigator.onLine) {
    await addToQueue('update_dispatch_logs', { logIds, updates })
    return { data: null, error: null }
  }

  const supabase = createClient()
  try {
    const res = await supabase
      .from('dispatch_log')
      .update(updates)
      .in('id', logIds)
    
    if (res.error && res.error.message.includes('Failed to fetch')) throw res.error
    return res
  } catch (err: any) {
    if (!isSync && typeof window !== 'undefined' && err?.message?.includes('Failed to fetch')) {
      await addToQueue('update_dispatch_logs', { logIds, updates })
      return { data: null, error: null }
    }
    return { data: null, error: err }
  }
}

export async function updateTicketStatus(logId: string, updates: {
  gt_status: string
  dt_status?: string | null
  remarks: string | null
  gt_maps_link: string | null
  gt_updated_at: string
}, isSync = false) {
  if (!isSync && typeof window !== 'undefined' && !navigator.onLine) {
    await addToQueue('update_ticket_status', { logId, updates })
    return { data: null, error: null }
  }

  const supabase = createClient()
  try {
    const res = await supabase
      .from('dispatch_log')
      .update(updates)
      .eq('id', logId)

    if (res.error && res.error.message.includes('Failed to fetch')) throw res.error
    return res
  } catch (err: any) {
    if (!isSync && typeof window !== 'undefined' && err?.message?.includes('Failed to fetch')) {
      await addToQueue('update_ticket_status', { logId, updates })
      return { data: null, error: null }
    }
    return { data: null, error: err }
  }
}
