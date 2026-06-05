'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const doSignOut = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/login')
    }
    doSignOut()
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-foreground/50">Signing out...</p>
      </div>
    </div>
  )
}
