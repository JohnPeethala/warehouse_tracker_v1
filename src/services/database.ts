import { createClient } from '@/utils/supabase/client'

export async function updateDispatchLogs(logIds: string[], updates: {
  vehicle_serial?: number | null
  vehicle_no?: string | null
  driver_name?: string | null
  gt?: string | null
}) {
  const supabase = createClient()
  return await supabase
    .from('dispatch_log')
    .update(updates)
    .in('id', logIds)
}

export async function updateTicketStatus(logId: string, updates: {
  gt_status: string
  remarks: string | null
  gt_maps_link: string | null
  gt_updated_at: string
}) {
  const supabase = createClient()
  return await supabase
    .from('dispatch_log')
    .update(updates)
    .eq('id', logId)
}
