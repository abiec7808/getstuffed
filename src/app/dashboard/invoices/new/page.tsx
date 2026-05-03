'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { InvoiceForm } from '@/components/invoice-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Customer } from '@/lib/types'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewInvoicePage() {
  const supabase = createClient()
  const router = useRouter()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      return data as Customer[]
    }
  })

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // 1. Create Invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          customer_id: values.customer_id,
          invoice_number: values.invoice_number,
          due_date: values.due_date,
          status: 'draft',
          tax: (values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)) * (values.tax_rate / 100),
          subtotal: values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0),
          discount: values.discount,
          total: (values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)) * (1 + values.tax_rate / 100) - values.discount,
          notes: values.notes,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // 2. Create Invoice Items
      const invoiceItems = values.items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
      if (itemsError) throw itemsError

      return invoice
    },
    onSuccess: () => {
      toast.success('Invoice created successfully')
      router.push('/dashboard/invoices')
      router.refresh()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error creating invoice')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full bg-white shadow-sm border-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">New Invoice</h1>
          <p className="text-muted-foreground">Fill in the details to create a professional invoice.</p>
        </div>
      </div>

      <InvoiceForm 
        type="invoice" 
        customers={customers || []} 
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}
