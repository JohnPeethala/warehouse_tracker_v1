import { createClient } from '@/utils/supabase/server'
import RouteCard from './RouteCard'

export default async function RouteList({ selectedDate }: { selectedDate: string }) {
  const supabase = await createClient()

  // Fetch tickets, vehicles, and ground teams in parallel
  const [ticketsRes, vehiclesRes, gtRes] = await Promise.all([
    supabase.from('dispatch_log').select('*').eq('scheduled_date', selectedDate),
    supabase.from('vehicles').select('vehicle_no, default_driver'),
    supabase.from('ground_teams').select('id, name').order('name'),
  ])

  if (ticketsRes.error) {
    return <div className="p-4 text-red-500 text-sm">Error loading routes: {ticketsRes.error.message}</div>
  }

  const tickets = ticketsRes.data || []
  const vehicles = vehiclesRes.data || []
  const groundTeams = gtRes.data || []

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-3xl">📭</span>
        </div>
        <p className="font-medium">No routes scheduled for this date</p>
      </div>
    )
  }

  // Group by route_name
  const routesMap = new Map<string, any[]>()
  tickets.forEach(ticket => {
    const route = ticket.route_name || 'Unassigned'
    if (!routesMap.has(route)) routesMap.set(route, [])
    routesMap.get(route)!.push(ticket)
  })

  const sortedRoutes = Array.from(routesMap.keys()).sort()

  return (
    <div className="flex flex-col gap-3">
      {sortedRoutes.map(routeName => (
        <RouteCard
          key={routeName}
          routeName={routeName}
          tickets={routesMap.get(routeName)!}
          vehicles={vehicles}
          groundTeams={groundTeams}
        />
      ))}
    </div>
  )
}
