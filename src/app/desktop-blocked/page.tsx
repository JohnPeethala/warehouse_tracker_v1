export default function DesktopBlockedPage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-xl overflow-hidden">
        <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Warehouse OPs</h1>
      <p className="text-base text-foreground/60 max-w-md mx-auto leading-relaxed">
        This application is designed specifically for field operations and must be accessed from a mobile device.
      </p>
      <p className="text-xs font-semibold text-primary/80 mt-8 uppercase tracking-widest">
        Please log in on your phone or tablet
      </p>
    </div>
  )
}
