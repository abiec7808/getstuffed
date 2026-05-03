'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardList, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Estimates', href: '/dashboard/estimates', icon: ClipboardList },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      toast.success('Signed out successfully')
      router.push('/auth/login')
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r-2 border-border/50 shadow-sm w-64 fixed left-0 top-0 z-40">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg transform -rotate-3">
            GS
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">GetStuffed</span>
        </div>
        
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border/50">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all group"
        >
          <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
