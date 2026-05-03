import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 md:pl-64 min-h-screen transition-all">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-right" expand={false} richColors />
    </div>
  )
}
