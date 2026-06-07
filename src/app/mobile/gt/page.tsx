import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GTView from '@/components/gt/GTView'

import { toYMD, sortLogs } from '@/utils/helpers'

export const dynamic = 'force-dynamic'

export default async function GroundTeamPage(props: { searchParams: Promise<{ date?: string }> }) {
  const cookieStore = await cookies()
  const searchParams = await props.searchParams
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ground') {
    redirect('/mobile/supervisor')
  }

  const gtName = (profile?.name ?? '').trim()
  const today = searchParams.date || toYMD(new Date())

  // Fetch GT trip for today
  const { data: trip } = await supabase
    .from('gt_trips')
    .select('id, odometer_start, odometer_end, vehicle_no')
    .eq('profile_id', user.id)
    .eq('trip_date', today)
    .maybeSingle()

  // Fetch dispatch logs assigned to this GT for today
  let query = supabase
    .from('dispatch_log')
    .select('id, ticket_id, route_name, vehicle_no, driver_name, gt, vehicle_serial, contact_name, location, sub_category, ticket_status, gt_status, remarks, notes, gt_maps_link')
    .eq('scheduled_date', today)

  if (gtName) {
    query = query.or(`gt.ilike.%${gtName}%,gt_id.eq.${user.id}`)
  } else {
    query = query.eq('gt_id', user.id)
  }
  
  const { data: logs } = await query.order('vehicle_serial', { ascending: true })

  // DEBUG: Fetch all logs for today to see what GTs are actually assigned
  const { data: allLogs } = await supabase.from('dispatch_log').select('gt').eq('scheduled_date', today)
  console.log('GT View Debug:', { 
    expectedGtName: gtName, 
    assignedGtsInDb: Array.from(new Set(allLogs?.map(l => l.gt))),
    matchedLogsCount: logs?.length
  })

  // Fetch dynamic status options
  let statusOptions = [
    { name: 'Done', color: 'emerald' },
    { name: 'Cx Cancelled', color: 'blue' },
    { name: 'Cx Rescheduled', color: 'blue' },
    { name: 'Cx not Responding', color: 'blue' },
    { name: 'Vehicle Issue', color: 'rose' },
    { name: 'Other', color: 'rose' }
  ]
  const { data: dbStatuses, error } = await supabase
    .from('gt_status_options')
    .select('status_name, color')
    .order('sort_order')
  if (dbStatuses && !error && dbStatuses.length > 0) {
    statusOptions = dbStatuses.map(s => ({
      name: s.status_name,
      color: s.color || 'primary'
    }))
  }

  // Fetch dynamic sub-categories
  const { data: subCategoriesData } = await supabase
    .from('settings_sub_categories')
    .select('name, icon, color')
    .order('name')

  // Infer the assigned vehicle and driver from today's dispatch log
  const firstValidLog = logs?.find(l => l.vehicle_no || l.driver_name)
  const assignedVehicle = firstValidLog?.vehicle_no || ''
  const assignedDriver = firstValidLog?.driver_name || ''

  return (
    <GTView 
      profileId={user.id}
      userName={gtName}
      trip={trip}
      assignedVehicle={assignedVehicle}
      assignedDriver={assignedDriver}
      logs={sortLogs(logs ?? [])}
      today={today}
      statusOptions={statusOptions}
      subCategories={subCategoriesData ?? []}
    />
  )
}
