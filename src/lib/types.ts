export type Profile = {
  id: string
  business_name: string | null
  business_address: string | null
  business_email: string | null
  business_phone: string | null
  logo_url: string | null
  default_tax_rate: number
  invoice_prefix: string
  estimate_prefix: string
  role: 'user' | 'admin'
  username: string | null
  bank_name: string | null
  account_holder: string | null
  account_number: string | null
  branch_code: string | null
  notes: string | null
  updated_at: string
}

export type Product = {
  id: string
  user_id: string
  description: string
  default_unit_price: number
  created_at: string
}

export type Customer = {
  id: string
  user_id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export type EstimateStatus = 'draft' | 'sent' | 'converted'

export type Estimate = {
  id: string
  user_id: string
  customer_id: string
  estimate_number: string
  status: EstimateStatus
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  created_at: string
  customer?: Customer
}

export type EstimateItem = {
  id: string
  estimate_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type Invoice = {
  id: string
  user_id: string
  customer_id: string
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  due_date: string | null
  created_at: string
  customer?: Customer
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'other'

export type Payment = {
  id: string
  invoice_id: string
  amount: number
  method: PaymentMethod
  payment_date: string
  created_at: string
}
