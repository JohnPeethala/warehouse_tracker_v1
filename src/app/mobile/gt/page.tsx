import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GTView from '@/components/gt/GTView'

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function sortLogs<T extends { sub_category: string | null }>(logs: T[]): T[] {
  return logs.sort((a, b) => {
    const getRank = (sub: string | null) => {
      if (!sub) return 99
      const s = sub.toLowerCase()
      if (s.includes('delivery')) return 1
      if (s.includes('pickup')) return 2
      return 3
    }
    const rA = getRank(a.sub_category)
    const rB = getRank(b.sub_category)
    if (rA !== rB) return rA - rB
    return (a.sub_category || '').localeCompare(b.sub_category || '')
  })
}

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
    .select('*')
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
    />
  )
}
