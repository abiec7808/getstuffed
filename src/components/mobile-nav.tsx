'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { SidebarContent } from './sidebar'
import { Button } from './ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetTitle
} from './ui/sheet'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('logo_url').eq('id', user.id).single()
      return data
    }
  })

  return (
    <div className="flex md:hidden items-center justify-between p-4 bg-sidebar border-b border-sidebar-border sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <img src={profile?.logo_url || "/logo.png"} alt="Logo" className="w-8 h-8 object-contain" />
        <span className="text-lg font-black tracking-tight text-sidebar-foreground">
          Get<span className="text-sidebar-primary">Stuffed</span>
        </span>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-sidebar border-r border-sidebar-border w-64 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent onNavItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
