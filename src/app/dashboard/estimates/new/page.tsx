'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { InvoiceForm } from '@/components/invoice-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Customer, Product } from '@/lib/types'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewEstimatePage() {
  const supabase = createClient()
  const router = useRouter()

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

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) throw error
      return data
    }
  })

  const { data: countData, isLoading: isCountLoading } = useQuery({
    queryKey: ['estimates-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('estimates').select('*', { count: 'exact', head: true })
      if (error) throw error
      return count || 0
    }
  })

  const isLoading = isCustomersLoading || isProductsLoading || isProfileLoading || isCountLoading

  const nextNumber = `EST-GTS${String((countData || 0) + 1).padStart(2, '0')}`

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // 1. Create Estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('estimates')
        .insert({
          user_id: user.id,
          customer_id: values.customer_id,
          estimate_number: values.number,
          status: 'draft',
          tax: (values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)) * (values.tax_rate / 100),
          subtotal: values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0),
          discount: values.discount,
          total: (values.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)) * (1 + values.tax_rate / 100) - values.discount,
          notes: values.notes,
        })
        .select()
        .single()

      if (estimateError) throw estimateError

      // 2. Create Estimate Items
      const estimateItems = values.items.map((item: any) => ({
        estimate_id: estimate.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase.from('estimate_items').insert(estimateItems)
      if (itemsError) throw itemsError

      return estimate
    },
    onSuccess: () => {
      toast.success('Estimate created successfully')
      router.push('/dashboard/estimates')
      router.refresh()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error creating estimate')
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
          <h1 className="text-4xl font-black tracking-tight text-foreground">New Estimate</h1>
          <p className="text-muted-foreground">Fill in the details to create a professional quote.</p>
        </div>
      </div>

      <InvoiceForm 
        type="estimate" 
        customers={customers || []} 
        products={products || []}
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
        defaultTaxRate={profile?.default_tax_rate}
        nextNumber={nextNumber}
      />
    </div>
  )
}
