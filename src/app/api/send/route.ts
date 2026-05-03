import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateInvoicePDF } from '@/lib/pdf-generator'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    const { id, type = 'invoice' } = await request.json()

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

    // Map items to generic format if needed
    if (type === 'estimate') {
      document.invoice_items = document.estimate_items
    }

    const pdfBytes = await generateInvoicePDF(document, document.customer, profile)
    
    // Convert Uint8Array to Buffer for Resend
    const pdfBuffer = Buffer.from(pdfBytes)

    const docName = type === 'invoice' ? 'Invoice' : 'Estimate'
    const docNumber = document.invoice_number || document.estimate_number

    if (!resend) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
    }

    const { data, error } = await resend.emails.send({
      from: 'Get Stuffed Cookies <onboarding@resend.dev>',
      to: [document.customer.email],
      subject: `${docName} ${docNumber} from Get Stuffed Cookies`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #3d3935;">
          <h1 style="color: #c98437;">${docName} ${docNumber}</h1>
          <p>Hi ${document.customer.name},</p>
          <p>Please find attached your ${docName.toLowerCase()} ${docNumber} from <strong>${profile?.business_name || 'Get Stuffed Cookies'}</strong>.</p>
          <p>Total Amount: <strong>R ${document.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Thank you for your business!</p>
        </div>
      `,
      attachments: [
        {
          filename: `${docNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Update status to 'sent' if it's currently 'draft'
    if (document.status === 'draft') {
      await supabase
        .from(type === 'invoice' ? 'invoices' : 'estimates')
        .update({ status: 'sent' })
        .eq('id', id)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in send API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
