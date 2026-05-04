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
  MoreVertical, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  MapPin,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Customer } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  registration_number: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      let query = supabase.from('customers').select('*')
      if (search) {
        query = query.ilike('name', `%${search}%`)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as Customer[]
    }
  })

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      registration_number: "",
      notes: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase.from('customers').insert({
        ...values,
        user_id: user.id
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created successfully')
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error creating customer')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      if (!editingCustomer) return
      const { data, error } = await supabase
        .from('customers')
        .update(values)
        .eq('id', editingCustomer.id)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer updated successfully')
      setIsDialogOpen(false)
      setEditingCustomer(null)
      form.reset()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error updating customer')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error deleting customer')
    }
  })

  const onSubmit = (values: CustomerFormValues) => {
    if (editingCustomer) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    form.reset({
      name: customer.name,
      contact_person: customer.contact_person || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      registration_number: customer.registration_number || "",
      notes: customer.notes || "",
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Customers</h1>
          <p className="text-muted-foreground">Manage your client base and contact information.</p>
        </div>
        <Button 
          onClick={() => {
            setEditingCustomer(null)
            form.reset({
              name: "",
              contact_person: "",
              email: "",
              phone: "",
              address: "",
              registration_number: "",
              notes: "",
            })
            setIsDialogOpen(true)
          }}
          className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-white border-2 focus-visible:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : customers?.length === 0 ? (
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first customer to the system.</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-xl font-bold">
                Add Your First Customer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold py-4">Customer</TableHead>
                  <TableHead className="font-bold py-4">Contact Info</TableHead>
                  <TableHead className="font-bold py-4">Address</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow key={customer.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-lg border-2 border-secondary/20 shadow-sm shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{customer.contact_person}</p>
                          {customer.registration_number && (
                            <p className="text-[10px] text-muted-foreground/60 truncate uppercase tracking-wider font-bold">Reg: {customer.registration_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" /> {customer.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" /> {customer.phone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-xs truncate">
                        <MapPin className="w-3 h-3 mt-1 flex-shrink-0" /> {customer.address || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2">
                          <DropdownMenuItem onClick={() => handleEdit(customer)} className="font-semibold cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this customer?')) {
                                deleteMutation.mutate(customer.id)
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="bg-brand-gradient p-10 text-white relative overflow-hidden">
            {/* Decorative mesh effect */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-black rounded-full blur-3xl"></div>
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tight">{editingCustomer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
              <DialogDescription className="text-white/90 font-bold text-base mt-2">
                {editingCustomer ? 'Update the profile for your client.' : 'Set up a new client profile in seconds.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold">Company / Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} className="rounded-xl border-2 h-11 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="rounded-xl border-2 h-11 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} className="rounded-xl border-2 h-11 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} className="rounded-xl border-2 h-11 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold">Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, Country" {...field} className="rounded-xl border-2 h-11 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold">Company Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="2024/123456/07" {...field} className="rounded-xl border-2 h-11 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl h-11 px-6 font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl h-11 px-8 font-bold shadow-lg"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
