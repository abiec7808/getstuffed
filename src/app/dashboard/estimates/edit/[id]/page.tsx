'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { InvoiceForm } from '@/components/invoice-form'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Customer, Product } from '@/lib/types'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditEstimatePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: estimate, isLoading: isEstimateLoading } = useQuery({
    queryKey: ['estimate', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimates')
        .select('*, items:estimate_items(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      return data as Customer[]
    }
  })
  
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('description')
      if (error) throw error
      return data as Product[]
    }
  })

  const isLoading = isEstimateLoading || isCustomersLoading || isProductsLoading

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      // 1. Update Estimate
      const { error: estimateError } = await supabase
        .from('estimates')
        .update({
          customer_id: values.customer_id,
          estimate_number: values.number,
          tax: (values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)) * (values.tax_rate / 100),
          subtotal: values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0),
          discount: values.discount,
          total: (values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)) * (1 + values.tax_rate / 100) - values.discount,
          notes: values.notes,
        })
        .eq('id', id)

      if (estimateError) throw estimateError

      // 2. Delete existing items
      const { error: deleteError } = await supabase
        .from('estimate_items')
        .delete()
        .eq('estimate_id', id)
      
      if (deleteError) throw deleteError

      // 3. Insert new items
      const estimateItems = values.items.map((item: any) => ({
        estimate_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase.from('estimate_items').insert(estimateItems)
      if (itemsError) throw itemsError

      return true
    },
    onSuccess: () => {
      toast.success('Estimate updated successfully')
      router.push('/dashboard/estimates')
      router.refresh()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error updating estimate')
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
          <h1 className="text-4xl font-black tracking-tight text-foreground">Edit Estimate</h1>
          <p className="text-muted-foreground">Update the details for this estimate.</p>
        </div>
      </div>

      <InvoiceForm 
        type="estimate" 
        customers={customers || []} 
        products={products || []}
        initialData={estimate}
        onSubmit={(values) => updateMutation.mutate(values)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
