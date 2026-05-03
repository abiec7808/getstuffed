'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Profile } from '@/lib/types'
import { Loader2, Building2, Mail, Phone, MapPin, Globe, Upload } from 'lucide-react'

const settingsSchema = z.object({
  business_name: z.string().min(2, "Name is required"),
  business_address: z.string().optional(),
  business_email: z.string().email("Invalid email").optional().or(z.literal("")),
  business_phone: z.string().optional(),
  default_tax_rate: z.coerce.number().min(0).max(100),
  invoice_prefix: z.string().min(1),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data as Profile
    }
  })

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: profile ? {
      business_name: profile.business_name || "",
      business_address: profile.business_address || "",
      business_email: profile.business_email || "",
      business_phone: profile.business_phone || "",
      default_tax_rate: profile.default_tax_rate,
      invoice_prefix: profile.invoice_prefix,
    } : {
      business_name: "",
      business_address: "",
      business_email: "",
      business_phone: "",
      default_tax_rate: 15,
      invoice_prefix: "INV-",
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Settings updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error updating settings')
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
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and app preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-8">
              <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription className="font-medium text-muted-foreground">
                    This information will appear on your invoices and estimates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-bold text-foreground">Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl border-2 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Business Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} className="rounded-xl border-2 h-11 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Business Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} className="rounded-xl border-2 h-11 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-bold text-foreground">Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                            <textarea 
                              {...field} 
                              className="w-full min-h-[100px] rounded-xl border-2 p-3 pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 bg-white"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Defaults & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="default_tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Default Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="rounded-xl border-2 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoice_prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Invoice Prefix</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl border-2 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <div className="p-8 bg-muted/30 border-t flex justify-end">
                  <Button 
                    type="submit" 
                    className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </Card>
            </form>
          </Form>
        </div>

        <div className="space-y-8">
          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Business Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="w-40 h-40 bg-white border-2 border-dashed border-primary/30 rounded-3xl flex items-center justify-center overflow-hidden group hover:border-primary transition-colors cursor-pointer relative">
                  {profile?.logo_url ? (
                    <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-primary/50 mx-auto mb-2 group-hover:text-primary transition-colors" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload Logo</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Recommended size: 400x400px. <br />
                  Supports PNG, JPG or SVG.
                </p>
                <Button variant="outline" className="rounded-xl font-bold w-full h-11 border-2">
                  Change Logo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
