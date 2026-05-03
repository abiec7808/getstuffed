import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Invoice, Customer, Profile } from './types'
import { format } from 'date-fns'

export async function generateInvoicePDF(invoice: any, customer: Customer, profile: Profile) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Colors
  const primaryColor = rgb(0.94, 0.29, 0.14) // #F04A23
  const secondaryColor = rgb(0.2, 0.2, 0.2) // Charcoal

  // Header
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: primaryColor,
  })

  page.drawText('INVOICE', {
    x: 40,
    y: height - 60,
    size: 30,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  page.drawText(invoice.invoice_number, {
    x: width - 200,
    y: height - 60,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  // Business Info
  let currentY = height - 140
  page.drawText(profile.business_name || 'My Business', {
    x: 40,
    y: currentY,
    size: 14,
    font: fontBold,
    color: secondaryColor,
  })
  currentY -= 20
  page.drawText(profile.business_address || '', {
    x: 40,
    y: currentY,
    size: 10,
    font: font,
    color: secondaryColor,
  })
  currentY -= 15
  page.drawText(profile.business_email || '', {
    x: 40,
    y: currentY,
    size: 10,
    font: font,
  })
  currentY -= 15
  page.drawText(profile.business_phone || '', {
    x: 40,
    y: currentY,
    size: 10,
    font: font,
  })

  // Customer Info
  currentY = height - 140
  page.drawText('BILL TO:', {
    x: width - 200,
    y: currentY,
    size: 10,
    font: fontBold,
    color: primaryColor,
  })
  currentY -= 20
  page.drawText(customer.name, {
    x: width - 200,
    y: currentY,
    size: 12,
    font: fontBold,
  })
  currentY -= 15
  page.drawText(customer.address || '', {
    x: width - 200,
    y: currentY,
    size: 10,
    font: font,
  })

  // Invoice Dates
  currentY = height - 250
  page.drawText(`Date: ${format(new Date(invoice.created_at), 'dd MMM yyyy')}`, {
    x: 40,
    y: currentY,
    size: 10,
    font: font,
  })
  if (invoice.due_date) {
    page.drawText(`Due Date: ${format(new Date(invoice.due_date), 'dd MMM yyyy')}`, {
      x: 150,
      y: currentY,
      size: 10,
      font: fontBold,
    })
  }

  // Table Header
  currentY -= 40
  page.drawRectangle({
    x: 40,
    y: currentY - 5,
    width: width - 80,
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
  })
  page.drawText('Description', { x: 50, y: currentY, size: 10, font: fontBold })
  page.drawText('Qty', { x: 350, y: currentY, size: 10, font: fontBold })
  page.drawText('Unit Price', { x: 400, y: currentY, size: 10, font: fontBold })
  page.drawText('Total', { x: 500, y: currentY, size: 10, font: fontBold })

  // Items
  currentY -= 30
  invoice.invoice_items.forEach((item: any) => {
    page.drawText(item.description, { x: 50, y: currentY, size: 10, font: font })
    page.drawText(item.quantity.toString(), { x: 350, y: currentY, size: 10, font: font })
    page.drawText(item.unit_price.toFixed(2), { x: 400, y: currentY, size: 10, font: font })
    page.drawText(item.total.toFixed(2), { x: 500, y: currentY, size: 10, font: font })
    currentY -= 20
    
    // Draw a line
    page.drawLine({
      start: { x: 40, y: currentY + 10 },
      end: { x: width - 40, y: currentY + 10 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    })
  })

  // Totals
  currentY -= 40
  const totalsX = width - 200
  page.drawText('Subtotal:', { x: totalsX, y: currentY, size: 10, font: font })
  page.drawText(`R ${invoice.subtotal.toFixed(2)}`, { x: width - 90, y: currentY, size: 10, font: font, color: secondaryColor })
  
  currentY -= 20
  page.drawText(`Tax (${invoice.tax / invoice.subtotal * 100 || 0}%):`, { x: totalsX, y: currentY, size: 10, font: font })
  page.drawText(`R ${invoice.tax.toFixed(2)}`, { x: width - 90, y: currentY, size: 10, font: font })

  if (invoice.discount > 0) {
    currentY -= 20
    page.drawText('Discount:', { x: totalsX, y: currentY, size: 10, font: font })
    page.drawText(`- R ${invoice.discount.toFixed(2)}`, { x: width - 90, y: currentY, size: 10, font: font })
  }

  currentY -= 30
  page.drawRectangle({
    x: totalsX - 10,
    y: currentY - 10,
    width: 200,
    height: 35,
    color: primaryColor,
  })
  page.drawText('TOTAL:', { x: totalsX, y: currentY, size: 14, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText(`R ${invoice.total.toFixed(2)}`, { x: width - 90, y: currentY, size: 14, font: fontBold, color: rgb(1, 1, 1) })

  // Footer / Notes
  if (invoice.notes) {
    currentY -= 60
    page.drawText('Notes:', { x: 40, y: currentY, size: 10, font: fontBold, color: primaryColor })
    currentY -= 20
    page.drawText(invoice.notes, { x: 40, y: currentY, size: 8, font: font, maxWidth: width - 80 })
  }

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
