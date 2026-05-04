import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/pdf-generator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') || 'invoice'

  if (!id) return new NextResponse('ID is required', { status: 400 })

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Fetch invoice/estimate data
  const { data: document, error: docError } = await supabase
    .from(type === 'invoice' ? 'invoices' : 'estimates')
    .select(`
      *,
      customer:customers(*),
      ${type === 'invoice' ? 'invoice_items(*)' : 'estimate_items(*)'}
    `)
    .eq('id', id)
    .single()

  if (docError || !document) {
    return new NextResponse('Document not found', { status: 404 })
  }

  // Fetch business profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Map estimate items to generic format if needed
  if (type === 'estimate') {
    document.invoice_items = document.estimate_items
  }

  const origin = new URL(request.url).origin
  const pdfBytes = await generateInvoicePDF(document, document.customer, profile, origin)

  // Wrap the bytes in a Blob so TypeScript accepts it as BodyInit
  const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })

  return new NextResponse(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${document.invoice_number || document.estimate_number}.pdf"`,
    },
  })
}
