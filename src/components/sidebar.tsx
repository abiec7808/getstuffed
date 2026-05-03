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
  ShieldCheck
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Estimates', href: '/dashboard/estimates', icon: ClipboardList },
  { name: 'Items', href: '/dashboard/items', icon: ClipboardList },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function SidebarContent({ onNavItemClick }: { onNavItemClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data
    }
  })

  const isAdmin = profile?.role === 'admin'

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
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10 px-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-sidebar-primary blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src={profile?.logo_url || "/logo.png"} 
              alt="Logo" 
              className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform relative z-10" 
            />
          </div>
          <span className="text-xl font-black tracking-tight text-sidebar-foreground">
            Get<span className="text-sidebar-primary">Stuffed</span>
          </span>
        </div>
        
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavItemClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20" 
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground")} />
                <span className="flex-1">{item.name}</span>
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary-foreground rounded-l-full" />}
              </Link>
            )
          })}
        </nav>

        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-sidebar-border">
            <p className="px-4 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/30">Admin Panel</p>
            <Link
              href="/dashboard/admin/users"
              onClick={onNavItemClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                pathname.startsWith('/dashboard/admin') 
                  ? "bg-secondary text-white shadow-lg shadow-secondary/20" 
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <ShieldCheck className={cn("w-5 h-5", pathname.startsWith('/dashboard/admin') ? "text-white" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground")} />
              <span className="flex-1">Manage Users</span>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border bg-sidebar-foreground/[0.02]">
        <button
          onClick={() => {
            handleSignOut()
            onNavItemClick?.()
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all group"
        >
          <LogOut className="w-5 h-5 text-sidebar-foreground/40 group-hover:text-destructive transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border shadow-2xl w-64 fixed left-0 top-0 z-40 text-sidebar-foreground transition-colors">
      <SidebarContent />
    </div>
  )
}

