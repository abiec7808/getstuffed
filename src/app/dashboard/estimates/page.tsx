'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  ClipboardList, 
  MoreVertical, 
  Eye, 
  FileCheck, 
  Trash2,
  Loader2,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Pencil,
  Mail
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Estimate, Customer } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

export default function EstimatesPage() {
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['estimates', search],
    queryFn: async () => {
      let query = supabase.from('estimates').select('*, customer:customers(*)')
      if (search) {
        query = query.ilike('estimate_number', `%${search}%`)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as (Estimate & { customer: Customer })[]
    }
  })

  const convertMutation = useMutation({
    mutationFn: async (estimate: any) => {
      // 1. Create Invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          user_id: estimate.user_id,
          customer_id: estimate.customer_id,
          invoice_number: `INV-${estimate.estimate_number.split('-')[1]}`,
          status: 'draft',
          subtotal: estimate.subtotal,
          tax: estimate.tax,
          discount: estimate.discount,
          total: estimate.total,
          notes: estimate.notes,
        })
        .select()
        .single()

      if (invError) throw invError

      // 2. Fetch Estimate Items
      const { data: items, error: itemsFetchError } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimate.id)

      if (itemsFetchError) throw itemsFetchError

      // 3. Create Invoice Items
      const invoiceItems = items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
      if (itemsError) throw itemsError

      // 4. Update Estimate Status
      await supabase.from('estimates').update({ status: 'converted' }).eq('id', estimate.id)

      return invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Converted to invoice successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error converting estimate')
    }
  })

  const sendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'estimate' })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }
      return response.json()
    },
    onMutate: () => {
      toast.loading('Sending email...', { id: 'send-email' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      toast.success('Email sent successfully', { id: 'send-email' })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error sending email', { id: 'send-email' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('estimates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      toast.success('Estimate deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error deleting estimate')
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Converted</Badge>
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><Send className="w-3 h-3" /> Sent</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Draft</Badge>
    }
  }

  const handleDownload = (id: string) => {
    window.open(`/api/pdf?id=${id}&type=estimate`, '_blank')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Estimates</h1>
          <p className="text-muted-foreground">Quote your clients and track potential projects.</p>
        </div>
        <Link href="/dashboard/estimates/new">
          <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 mr-2" />
            Create Estimate
          </Button>
        </Link>
      </div>

      <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by estimate number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-white border-2 focus-visible:ring-primary"
            />
          </div>
          <Button variant="outline" className="rounded-xl ml-4 font-bold">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : estimates?.length === 0 ? (
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No estimates found</h3>
              <p className="text-muted-foreground mb-6">Create your first quote to win more business.</p>
              <Link href="/dashboard/estimates/new">
                <Button variant="outline" className="rounded-xl font-bold">
                  Create Your First Estimate
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold py-4">Estimate #</TableHead>
                  <TableHead className="font-bold py-4">Customer</TableHead>
                  <TableHead className="font-bold py-4 text-right">Amount</TableHead>
                  <TableHead className="font-bold py-4">Date</TableHead>
                  <TableHead className="font-bold py-4">Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates?.map((estimate) => (
                  <TableRow key={estimate.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-black text-primary">
                      {estimate.estimate_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {estimate.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold">{estimate.customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R {estimate.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      {format(new Date(estimate.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(estimate.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2">
                          <Link href={`/dashboard/estimates/edit/${estimate.id}`}>
                            <DropdownMenuItem className="font-semibold cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Edit Estimate
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            onClick={() => sendEmailMutation.mutate(estimate.id)}
                            className="font-semibold cursor-pointer"
                          >
                            <Mail className="w-4 h-4 mr-2" /> Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownload(estimate.id)}
                            className="font-semibold cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => convertMutation.mutate(estimate)}
                            disabled={estimate.status === 'converted' || convertMutation.isPending}
                            className="font-semibold cursor-pointer"
                          >
                            {convertMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
                            Convert to Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this estimate?')) {
                                deleteMutation.mutate(estimate.id)
                              }
                            }}
                            className="font-semibold text-destructive cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
