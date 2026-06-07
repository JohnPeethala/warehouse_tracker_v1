'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!phone || !password) {
    redirect('/login?message=Phone and password are required')
  }

  const cleanPhone = phone.replace(/\D/g, '')
  const email = `${cleanPhone}@warehouse.local`

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
