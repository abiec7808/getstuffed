'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Customer, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Search, Plus, Trash2, Calculator, Save, Send, Loader2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const itemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Min 1"),
  unit_price: z.number().min(0, "Min 0"),
  total: z.number(),
})

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

const invoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  number: z.string().min(1, "Number is required"),
  due_date: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  tax_rate: z.number(),
  discount: z.number(),
  notes: z.string().optional(),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface Props {
  type: 'invoice' | 'estimate'
  customers: Customer[]
  products: Product[]
  initialData?: any
  onSubmit: (values: any) => void
  isSubmitting?: boolean
  defaultTaxRate?: number
  nextNumber?: string
}

export function InvoiceForm({ 
  type, 
  customers = [], 
  products = [], 
  initialData, 
  onSubmit, 
  isSubmitting,
  defaultTaxRate,
  nextNumber
}: Props) {
  const [productSearch, setProductSearch] = useState('')
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  
  const supabase = createClient()
  const queryClient = useQueryClient()

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    },
  })

  const createCustomerMutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...values,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data as Customer
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created successfully')
      setIsCustomerDialogOpen(false)
      customerForm.reset()
      // Automatically select the new customer
      form.setValue('customer_id', newCustomer.id)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error creating customer')
    }
  })

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: initialData?.customer_id || "",
      number: initialData?.invoice_number || initialData?.estimate_number || nextNumber || "",
      due_date: initialData?.due_date || "",
      notes: initialData?.notes || "",
      items: initialData?.items?.map((item: any) => ({
        description: item.description || "",
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: (item.quantity || 0) * (item.unit_price || 0)
      })) || [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      tax_rate: initialData?.tax_rate ?? defaultTaxRate ?? 15,
      discount: initialData?.discount || 0,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        customer_id: initialData.customer_id || "",
        number: initialData.estimate_number || initialData.invoice_number || "",
        due_date: initialData.due_date || "",
        notes: initialData.notes || "",
        items: initialData.items?.map((item: any) => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: (item.quantity || 0) * (item.unit_price || 0)
        })) || [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
        tax_rate: initialData.tax_rate ?? defaultTaxRate ?? 0,
        discount: initialData.discount || 0,
      })
    } else if (nextNumber) {
      form.setValue('number', nextNumber)
    }
  }, [initialData, form, defaultTaxRate, nextNumber])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchItems = form.watch("items")
  const watchTaxRate = form.watch("tax_rate")
  const watchDiscount = form.watch("discount")

  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    discountAmount: 0,
    total: 0,
  })

  useEffect(() => {
    const subtotal = watchItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0)
    const tax = subtotal * ((watchTaxRate || 0) / 100)
    const discountAmount = watchDiscount || 0
    const total = subtotal + tax - discountAmount
    
    setTotals({ subtotal, tax, discountAmount, total })
  }, [watchItems, watchTaxRate, watchDiscount])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-xl font-black text-primary">General Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-bold">Customer</FormLabel>
                        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg"
                            >
                              <UserPlus className="w-3 h-3 mr-1" /> Quick Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
                            <div className="bg-primary p-8 text-white relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                                <div className="absolute -top-10 -left-10 w-24 h-24 bg-white rounded-full blur-2xl"></div>
                              </div>
                              <DialogHeader className="relative z-10">
                                <DialogTitle className="text-2xl font-black">Quick Add Customer</DialogTitle>
                                <DialogDescription className="text-white/80 font-bold">
                                  Fill in the basics to keep moving.
                                </DialogDescription>
                              </DialogHeader>
                            </div>
                            <div className="p-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                  <Label className="font-bold text-sm">Company / Name</Label>
                                  <Input 
                                    {...customerForm.register('name')} 
                                    placeholder="Acme Corp" 
                                    className="rounded-xl border-2 h-10 focus-visible:ring-primary"
                                  />
                                  {customerForm.formState.errors.name && (
                                    <p className="text-xs text-destructive font-bold">{customerForm.formState.errors.name.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold text-sm">Contact Person</Label>
                                  <Input 
                                    {...customerForm.register('contact_person')} 
                                    placeholder="John Doe" 
                                    className="rounded-xl border-2 h-10 focus-visible:ring-primary"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold text-sm">Email</Label>
                                  <Input 
                                    {...customerForm.register('email')} 
                                    placeholder="john@example.com" 
                                    className="rounded-xl border-2 h-10 focus-visible:ring-primary"
                                  />
                                </div>
                              </div>
                              <DialogFooter className="pt-4">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setIsCustomerDialogOpen(false)}
                                  className="rounded-xl h-10 font-bold"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="button"
                                  onClick={customerForm.handleSubmit((vals) => createCustomerMutation.mutate(vals))}
                                  className="rounded-xl h-10 font-bold shadow-lg px-6"
                                  disabled={createCustomerMutation.isPending}
                                >
                                  {createCustomerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save Customer
                                </Button>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-2xl border-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl">
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id} className="rounded-xl">
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">{type === 'invoice' ? 'Invoice' : 'Estimate'} Number</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-2xl border-2 focus:ring-primary/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {type === 'invoice' && (
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="rounded-2xl border-2 focus:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black text-primary">Line Items</CardTitle>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="rounded-xl border-2 font-bold hover:bg-secondary hover:text-white transition-colors">
                        <Search className="w-4 h-4 mr-2" /> Library
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-3xl border-2">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Item Library</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Search items..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-10 rounded-xl border-2"
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                          {(products || []).filter(p => p.description.toLowerCase().includes(productSearch.toLowerCase()))?.map((product) => (
                            <div 
                              key={product.id}
                              className="group flex items-center justify-between p-4 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer"
                              onClick={() => {
                                append({
                                  description: product.description,
                                  quantity: 1,
                                  unit_price: product.default_unit_price,
                                  total: product.default_unit_price,
                                })
                                setProductSearch('')
                                setIsProductDialogOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground">{product.description}</span>
                                <span className="text-xs text-muted-foreground">Default: R {product.default_unit_price.toFixed(2)}</span>
                              </div>
                              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                    <div className="border-2 rounded-2xl overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-bold py-4 min-w-[300px]">Description</TableHead>
                              <TableHead className="font-bold py-4 w-24">Qty</TableHead>
                              <TableHead className="font-bold py-4 w-32">Price (R)</TableHead>
                              <TableHead className="font-bold py-4 w-32 text-right">Total (R)</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, index) => (
                              <TableRow key={field.id} className="group hover:bg-muted/30">
                                <TableCell className="py-4">
                                  <div className="relative group/search">
                                    <Input
                                      {...form.register(`items.${index}.description` as const)}
                                      placeholder="What are you charging for?"
                                      className="rounded-xl border-2 focus-visible:ring-primary h-11"
                                    />
                                    {products.length > 0 && (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/search:opacity-100 transition-opacity">
                                        <Search className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Input
                                    type="number"
                                    {...form.register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                                    className="rounded-xl border-2 focus-visible:ring-primary h-11"
                                  />
                                </TableCell>
                                <TableCell className="py-4">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...form.register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                                    className="rounded-xl border-2 focus-visible:ring-primary h-11"
                                  />
                                </TableCell>
                                <TableCell className="py-4 text-right font-black text-lg">
                                  {(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unit_price`) || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="py-4">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                    className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="p-4 bg-muted/20 border-t-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => append({ description: "", quantity: 1, unit_price: 0, total: 0 })}
                          className="rounded-xl font-bold border-2 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Line Item
                        </Button>
                      </div>
                    </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-xl font-black text-primary">Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea 
                          {...field} 
                          value={field.value ?? ""}
                          className="w-full min-h-[120px] rounded-2xl border-2 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 bg-white"
                          placeholder="Include payment terms, bank details, or a thank you note..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="space-y-8">
            <Card className="border-2 shadow-xl rounded-3xl overflow-hidden sticky top-8">
              <CardHeader className="bg-primary text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
                <CardTitle className="text-xl font-black flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Summary
                  </div>
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-bold">R {totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tax Rate (%)</Label>
                    <FormField
                      control={form.control}
                      name="tax_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="rounded-xl border-2" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between items-center text-muted-foreground pt-1">
                      <span className="text-sm font-semibold">Tax Amount</span>
                      <span className="text-sm font-bold">R {totals.tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Discount (Value)</Label>
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="rounded-xl border-2" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-6 border-t-2 border-dashed flex justify-between items-center text-primary">
                    <span className="text-xl font-black">Total</span>
                    <span className="text-2xl font-black underline decoration-primary/20">R {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 bg-muted/30 flex flex-col gap-3">
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save {type === 'invoice' ? 'Invoice' : 'Estimate'}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 rounded-2xl font-bold border-2"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Save & Send
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
