'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserCog, Mail, Shield, ShieldAlert } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Profile } from '@/lib/types'

export default function AdminUsersPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('business_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User role updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error updating role')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions for all platform users.</p>
        </div>
      </div>

      <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            Platform Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold py-4">Business / Username</TableHead>
                <TableHead className="font-bold py-4">Email</TableHead>
                <TableHead className="font-bold py-4">Role</TableHead>
                <TableHead className="font-bold py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm",
                        user.role === 'admin' ? "bg-secondary" : "bg-primary"
                      )}>
                        {user.business_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-black text-foreground">{user.business_name || 'No Name'}</p>
                        <p className="text-xs text-muted-foreground font-medium">{user.username || 'No username set'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">{user.business_email || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20 rounded-full font-bold px-3 py-1 gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full font-bold px-3 py-1 gap-1">
                        <UserCog className="w-3 h-3" /> User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select 
                      defaultValue={user.role} 
                      onValueChange={(val) => updateRoleMutation.mutate({ id: user.id, role: val })}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[130px] ml-auto rounded-xl border-2 font-bold h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        <SelectItem value="user" className="font-bold">User</SelectItem>
                        <SelectItem value="admin" className="font-bold text-secondary">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <h4 className="font-black text-amber-900 mb-1">Administrative Warning</h4>
          <p className="text-sm text-amber-800 font-medium">
            Granting administrative privileges allows users to view and modify all business data across the platform. Use this power carefully.
          </p>
        </div>
      </div>
    </div>
  )
}
