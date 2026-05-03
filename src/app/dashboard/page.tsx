'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  ClipboardList, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Users
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const supabase = createClient()

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: invoiceCount },
        { count: estimateCount },
        { data: paidInvoices },
        { data: outstandingInvoices },
      ] = await Promise.all([
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('estimates').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('total').eq('status', 'paid'),
        supabase.from('invoices').select('total').neq('status', 'paid'),
      ])

      const revenue = paidInvoices?.reduce((acc, inv) => acc + (inv.total || 0), 0) || 0
      const outstanding = outstandingInvoices?.reduce((acc, inv) => acc + (inv.total || 0), 0) || 0

      return {
        invoiceCount: invoiceCount || 0,
        estimateCount: estimateCount || 0,
        revenue,
        outstanding,
      }
    }
  })

  const { data: recentActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5)
      
      const { data: estimates } = await supabase
        .from('estimates')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      const combined = [
        ...(invoices?.map(inv => ({ ...inv, type: 'invoice' })) || []),
        ...(estimates?.map(est => ({ ...est, type: 'estimate' })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

      return combined
    }
  })

  const { data: recentCustomers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['recent-customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    }
  })

  const stats = [
    {
      title: 'Total Invoices',
      value: isStatsLoading ? '...' : statsData?.invoiceCount,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Estimates',
      value: isStatsLoading ? '...' : statsData?.estimateCount,
      icon: ClipboardList,
      color: 'text-brand-red',
      bg: 'bg-brand-red/10',
    },
    {
      title: 'Revenue (Paid)',
      value: isStatsLoading ? '...' : `R ${statsData?.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Outstanding',
      value: isStatsLoading ? '...' : `R ${statsData?.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-brand-red',
      bg: 'bg-brand-red/10',
    },
  ]

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2 shadow-sm rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 border-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-2xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">
                {isStatsLoading ? <Skeleton className="h-9 w-24" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-2 shadow-sm rounded-3xl border-muted/50 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-6">
            <CardTitle className="flex items-center gap-3 text-xl font-black">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted/50">
              {isActivityLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-6 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : (
                recentActivity?.map((item: any, i) => (
                  <div key={i} className="flex items-center gap-4 p-6 hover:bg-muted/30 transition-colors">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-110",
                      item.type === 'invoice' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {item.type === 'invoice' ? <FileText className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">
                        {item.type === 'invoice' ? 'Invoice' : 'Estimate'} #{item.invoice_number || item.estimate_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.customers?.name} • {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black">R {item.total?.toFixed(2)}</div>
                      <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mt-1",
                        item.status === 'paid' ? "bg-green-100 text-green-700" : 
                        item.status === 'sent' ? "bg-blue-100 text-blue-700" : 
                        "bg-muted text-muted-foreground"
                      )}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!isActivityLoading && recentActivity?.length === 0 && (
                <div className="p-12 text-center text-muted-foreground font-medium">
                  No recent activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm rounded-3xl border-muted/50 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-6">
            <CardTitle className="flex items-center gap-3 text-xl font-black">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              Recent Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted/50">
              {isCustomersLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-6 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : (
                recentCustomers?.map((customer, i) => (
                  <div key={i} className="flex items-center gap-4 p-6 hover:bg-muted/30 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-lg">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.email || 'No email'}</p>
                    </div>
                    <div className="text-xs font-black px-3 py-1 bg-muted rounded-xl uppercase tracking-tighter">
                      Customer
                    </div>
                  </div>
                ))
              )}
              {!isCustomersLoading && recentCustomers?.length === 0 && (
                <div className="p-12 text-center text-muted-foreground font-medium">
                  No customers found yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

