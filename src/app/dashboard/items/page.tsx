'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Package, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Product } from '@/lib/types'

export default function ItemsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)

  // Form states
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')

  const { data: items, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Product[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const payload = {
        description,
        default_unit_price: parseFloat(price) || 0,
        user_id: user.id
      }

      if (editingItem) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(editingItem ? 'Item updated' : 'Item added')
      closeDialog()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error saving item')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Item deleted')
    }
  })

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setDescription('')
    setPrice('0')
  }

  const openEdit = (item: Product) => {
    setEditingItem(item)
    setDescription(item.description)
    setPrice(item.default_unit_price.toString())
    setIsDialogOpen(true)
  }

  const filteredItems = items?.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Item Library</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Package className="w-4 h-4" />
            Manage your reusable products and services for faster invoicing.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button 
              className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl border-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold text-foreground">Description</Label>
                <Input 
                  id="description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Graphic Design Services" 
                  className="rounded-xl border-2 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="font-bold text-foreground">Default Price</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00" 
                  className="rounded-xl border-2 h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={closeDialog} 
                className="rounded-xl font-bold h-11"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                className="rounded-xl font-bold h-11 px-8"
                disabled={saveMutation.isPending || !description}
              >
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'Update Item' : 'Save Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-6 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-2 h-11 bg-white"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[400px] font-bold text-foreground h-12 px-6">Description</TableHead>
                <TableHead className="font-bold text-foreground h-12 px-6 text-right">Default Price</TableHead>
                <TableHead className="w-[100px] h-12 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filteredItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Package className="w-12 h-12" />
                      <p className="font-bold text-lg">No items found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="px-6 py-4 font-bold text-foreground">
                      {item.description}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-black text-primary">
                      R {item.default_unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl group-hover:bg-white transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-2 p-2 min-w-[160px]">
                          <DropdownMenuItem 
                            onClick={() => openEdit(item)}
                            className="rounded-xl font-bold gap-3 py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this item?')) {
                                deleteMutation.mutate(item.id)
                              }
                            }}
                            className="rounded-xl font-bold gap-3 py-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
