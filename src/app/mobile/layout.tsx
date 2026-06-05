export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white min-h-screen text-gray-900 w-full max-w-md mx-auto shadow-sm relative overflow-x-hidden pb-safe">
      {/* 
        This wrapper enforces a mobile-first, strict Light Theme. 
        It centers the content on larger screens to simulate a mobile view.
      */}
      {children}
    </div>
  )
}
