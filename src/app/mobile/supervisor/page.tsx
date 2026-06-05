import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SupervisorView from '@/components/supervisor/SupervisorView'

export default async function SupervisorPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { date } = await searchParams
  const selectedDate = date ?? new Date().toISOString().split('T')[0]

  const nextDate = new Date(selectedDate)
  nextDate.setDate(nextDate.getDate() + 1)
  const nextDateStr = nextDate.toISOString().split('T')[0]

  // Fetch user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const { data: logs } = await supabase
    .from('dispatch_log')
    .select('id, ticket_id, route_name, vehicle_no, driver_name, gt, vehicle_serial, contact_name, location, sub_category, ticket_status, notes')
    .gte('scheduled_date', selectedDate)
    .lt('scheduled_date', nextDateStr)
    .order('route_name')
    .order('ticket_id')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_no, default_driver')
    .order('vehicle_no')

  const { data: groundTeam } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'ground')
    .order('first_name')

  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : user.email?.split('@')[0] ?? 'Supervisor'

  return (
    <SupervisorView
      selectedDate={selectedDate}
      logs={logs ?? []}
      vehicles={vehicles ?? []}
      groundTeam={groundTeam ?? []}
      userName={displayName}
    />
  )
}
