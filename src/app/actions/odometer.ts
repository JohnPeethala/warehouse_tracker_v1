'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function upsertGTTripAction(payload: any) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  try {
    let res;
    if (payload.id) {
      res = await supabase.from('gt_trips').update(payload).eq('id', payload.id).select().single()
    } else {
      res = await supabase.from('gt_trips').insert(payload).select().single()
    }
    
    if (res.error && res.error.code === '23505') {
       res = await supabase.from('gt_trips').update(payload)
         .eq('profile_id', payload.profile_id)
         .eq('trip_date', payload.trip_date)
         .select().single()
       if (res.error) res.error.message = `[Fallback Update] ${res.error.message}`
    } else if (res.error) {
       res.error.message = `[Insert/Primary Update] ${res.error.message}`
    }

    if (res.error) {
      console.error('Server Action Error:', res.error)
      return { data: null, error: res.error }
    }
    
    revalidatePath('/', 'layout')
    return { data: res.data, error: null }
  } catch (err: any) {
    console.error('Server Action Exception:', err)
    return { data: null, error: err }
  }
}
