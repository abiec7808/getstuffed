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
  FileText, 
  MoreVertical, 
  Eye, 
  Download, 
  Trash2,
  Loader2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Invoice, Customer } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', search],
    queryFn: async () => {
      let query = supabase.from('invoices').select('*, customer:customers(*)')
      if (search) {
        query = query.ilike('invoice_number', `%${search}%`)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as (Invoice & { customer: Customer })[]
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error deleting invoice')
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><Send className="w-3 h-3" /> Sent</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Overdue</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-full border-none font-bold px-3 py-1 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Draft</Badge>
    }
  }
  const handleDownload = (id: string) => {
    window.open(`/api/pdf?id=${id}&type=invoice`, '_blank')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your customer billings.</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by invoice number..." 
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
          ) : invoices?.length === 0 ? (
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-6">Create your first invoice to start getting paid.</p>
              <Link href="/dashboard/invoices/new">
                <Button variant="outline" className="rounded-xl font-bold">
                  Create Your First Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold py-4">Invoice #</TableHead>
                  <TableHead className="font-bold py-4">Customer</TableHead>
                  <TableHead className="font-bold py-4 text-right">Amount</TableHead>
                  <TableHead className="font-bold py-4">Due Date</TableHead>
                  <TableHead className="font-bold py-4">Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow key={invoice.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-black text-primary">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {invoice.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold">{invoice.customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : 'No date'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2">
                          <DropdownMenuItem 
                            onClick={() => handleDownload(invoice.id)}
                            className="font-semibold cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownload(invoice.id)}
                            className="font-semibold cursor-pointer"
                          >
                            <Download className="w-4 h-4 mr-2" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this invoice?')) {
                                deleteMutation.mutate(invoice.id)
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
