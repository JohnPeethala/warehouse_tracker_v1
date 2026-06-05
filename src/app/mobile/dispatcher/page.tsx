import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DatePicker from '@/components/dispatcher/DatePicker'
import RouteList from '@/components/dispatcher/RouteList'

export default async function DispatcherPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  // Default to today if no date is provided
  const selectedDate = resolvedParams?.date || new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Dispatcher Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage routes and assign teams</p>
      </header>

      <div className="px-4 py-6 bg-white border-b border-gray-200">
        <DatePicker selectedDate={selectedDate} />
      </div>

      <main className="flex-1 p-4">
        <RouteList selectedDate={selectedDate} />
      </main>
    </div>
  )
}
