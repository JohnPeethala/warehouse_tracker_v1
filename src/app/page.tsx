import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware should handle this, but as a fallback, go to login
  redirect('/login')
}
