import { login } from "./actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Ambient background blobs matching v2 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-foreground/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-foreground text-background mb-4 shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Warehouse OPs</h1>
          <p className="text-sm text-foreground/50 mt-1">Operations & Dispatch Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-6">
          <h2 className="text-sm font-semibold text-foreground/70 mb-5 uppercase tracking-widest text-center">
            Secure Access
          </h2>

          <form action={login} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground/60">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email..."
                required
                autoComplete="email"
                autoFocus
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground/60">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password..."
                required
                autoComplete="current-password"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all"
              />
            </div>

            {resolvedParams?.message && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
                {resolvedParams.message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-foreground text-background font-semibold py-2.5 rounded-lg text-sm hover:opacity-85 transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              Sign In
            </button>
          </form>

          <p className="text-[11px] text-foreground/30 text-center mt-4">
            Role-based authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  )
}
