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
import { Plus, Trash2, Save, Send, Loader2, Calculator } from 'lucide-react'
import { Customer } from '@/lib/types'
import { cn } from '@/lib/utils'

const itemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  unit_price: z.coerce.number().min(0, "Min 0"),
  total: z.coerce.number(),
})

const invoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  invoice_number: z.string().min(1, "Number is required"),
  due_date: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  tax_rate: z.coerce.number().default(15),
  discount: z.coerce.number().default(0),
  notes: z.string().optional(),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface Props {
  type: 'invoice' | 'estimate'
  customers: Customer[]
  initialData?: any
  onSubmit: (values: any) => void
  isSubmitting?: boolean
}

export function InvoiceForm({ type, customers, initialData, onSubmit, isSubmitting }: Props) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      customer_id: "",
      invoice_number: `${type === 'invoice' ? 'INV' : 'EST'}-${Date.now().toString().slice(-6)}`,
      items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      tax_rate: 15,
      discount: 0,
      notes: "",
    },
  })

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
    const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    const tax = subtotal * (watchTaxRate / 100)
    const discountAmount = watchDiscount
    const total = subtotal + tax - discountAmount
    
    setTotals({ subtotal, tax, discountAmount, total })
  }, [watchItems, watchTaxRate, watchDiscount])

  const handleItemChange = (index: number) => {
    const item = form.getValues(`items.${index}`)
    form.setValue(`items.${index}.total`, item.quantity * item.unit_price)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
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
                      <FormLabel className="font-bold">Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2 h-11">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2">
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">{type === 'invoice' ? 'Invoice' : 'Estimate'} Number</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl border-2 h-11" />
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
                          <Input type="date" {...field} className="rounded-xl border-2 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black text-primary">Line Items</CardTitle>
                <Button 
                  type="button" 
                  onClick={() => append({ description: "", quantity: 1, unit_price: 0, total: 0 })}
                  variant="outline"
                  className="rounded-xl border-2 font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold py-4">Description</TableHead>
                      <TableHead className="font-bold py-4 w-24">Qty</TableHead>
                      <TableHead className="font-bold py-4 w-32">Price</TableHead>
                      <TableHead className="font-bold py-4 w-32">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="hover:bg-muted/30">
                        <TableCell className="py-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Service or product description" {...field} className="rounded-xl border-2" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    className="rounded-xl border-2" 
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleItemChange(index)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit_price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    className="rounded-xl border-2" 
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleItemChange(index)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="py-4 font-bold text-right">
                          R {watchItems[index]?.total?.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <CardHeader className="bg-primary text-white">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Summary
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
                            <Input type="number" {...field} className="rounded-xl border-2" />
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
                            <Input type="number" {...field} className="rounded-xl border-2" />
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
