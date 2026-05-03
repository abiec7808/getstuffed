import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Customer, Profile } from './types'
import { format } from 'date-fns'

export async function generateInvoicePDF(data: any, customer: Customer, profile: Profile) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Detect type
  const isEstimate = !!data.estimate_number
  const title = isEstimate ? 'ESTIMATE' : 'INVOICE'
  const docNumber = data.invoice_number || data.estimate_number
  const items = data.invoice_items || data.estimate_items || []

  // Brand Colors - Derived from the Get Stuffed Cookies Logo
  const primaryColor = rgb(0.788, 0.518, 0.216) // #C98437 (Gold)
  const secondaryColor = rgb(1.0, 0.294, 0.227) // #FF4B3A (Vibrant Red/Coral)
  const textColor = rgb(0.239, 0.224, 0.208) // #3D3935 (Dark Brown/Charcoal)
  const secondaryTextColor = rgb(0.45, 0.45, 0.45)
  const lightBg = rgb(0.98, 0.96, 0.94) // Creamy light background
  const borderColor = rgb(0.9, 0.85, 0.8)

  // 1. Premium Header
  page.drawRectangle({
    x: 0,
    y: height - 160,
    width: width,
    height: 160,
    color: primaryColor,
  })

  // Header Content
  // Logo & Title
  const businessTitle = profile.business_name?.toUpperCase() || 'GET STUFFED COOKIES'
  
  if (profile.logo_url) {
    try {
      const logoResponse = await fetch(profile.logo_url)
      const logoBytes = await logoResponse.arrayBuffer()
      const isPng = profile.logo_url.toLowerCase().endsWith('.png')
      const logoImage = isPng ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes)
      
      const scale = 80 / logoImage.height
      const logoWidth = logoImage.width * scale
      page.drawImage(logoImage, {
        x: 40,
        y: height - 120,
        width: logoWidth,
        height: 80,
      })
    } catch (e) {
      console.error('Failed to embed logo:', e)
    }
  }

  // Business Name in Header
  page.drawText(businessTitle, {
    x: 40,
    y: height - 145,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  // Document Title & Info
  page.drawText(title, {
    x: width - fontBold.widthOfTextAtSize(title, 36) - 40,
    y: height - 80,
    size: 36,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  const docNumText = `${isEstimate ? 'Estimate' : 'Invoice'} #${docNumber}`
  page.drawText(docNumText, {
    x: width - font.widthOfTextAtSize(docNumText, 14) - 40,
    y: height - 105,
    size: 14,
    font: font,
    color: rgb(1, 1, 1),
  })

  // Status Badge in Header
  if (!isEstimate) {
    const status = data.status || 'outstanding'
    const isPaid = status === 'paid'
    const statusText = isPaid ? 'PAID' : 'OUTSTANDING'
    const statusColor = isPaid ? rgb(1, 1, 1) : rgb(1, 1, 1)
    const statusBg = isPaid ? rgb(0.2, 0.6, 0.2) : secondaryColor

    const badgeWidth = fontBold.widthOfTextAtSize(statusText, 10) + 20
    page.drawRectangle({
      x: width - badgeWidth - 40,
      y: height - 135,
      width: badgeWidth,
      height: 20,
      color: statusBg,
    })
    page.drawText(statusText, {
      x: width - badgeWidth - 30,
      y: height - 128,
      size: 10,
      font: fontBold,
      color: statusColor,
    })
  }

  // 2. Info Grid
  let currentY = height - 210

  // From (Business)
  const leftColX = 40
  const rightColX = width / 2 + 20

  page.drawText('FROM', { x: leftColX, y: currentY, size: 8, font: fontBold, color: primaryColor })
  currentY -= 18
  page.drawText(profile.business_name || 'Get Stuffed Cookies', { x: leftColX, y: currentY, size: 12, font: fontBold, color: textColor })
  currentY -= 15
  if (profile.business_address) {
    page.drawText(profile.business_address, { x: leftColX, y: currentY, size: 9, font: font, color: secondaryTextColor, maxWidth: 200, lineHeight: 11 })
    currentY -= 25
  }
  page.drawText(profile.business_email || '', { x: leftColX, y: currentY, size: 9, font: font, color: secondaryTextColor })
  currentY -= 13
  page.drawText(profile.business_phone || '', { x: leftColX, y: currentY, size: 9, font: font, color: secondaryTextColor })

  // Bill To
  let billToY = height - 210
  page.drawText('BILL TO', { x: rightColX, y: billToY, size: 8, font: fontBold, color: primaryColor })
  billToY -= 18
  page.drawText(customer.name, { x: rightColX, y: billToY, size: 12, font: fontBold, color: textColor })
  billToY -= 15
  if (customer.address) {
    page.drawText(customer.address, { 
      x: rightColX, 
      y: billToY, 
      size: 9, 
      font: font, 
      color: secondaryTextColor,
      maxWidth: 200,
      lineHeight: 11
    })
    billToY -= 25
  }
  page.drawText(customer.email || '', { x: rightColX, y: billToY, size: 9, font: font, color: secondaryTextColor })

  // Dates Bar
  currentY = Math.min(currentY, billToY) - 45
  page.drawRectangle({
    x: 40,
    y: currentY - 10,
    width: width - 80,
    height: 45,
    color: lightBg,
    borderColor: borderColor,
    borderWidth: 0.5,
  })

  page.drawText('DATE ISSUED', { x: 55, y: currentY + 18, size: 7, font: fontBold, color: secondaryTextColor })
  page.drawText(format(new Date(data.created_at), 'dd MMM yyyy'), { x: 55, y: currentY + 2, size: 10, font: fontBold, color: textColor })

  if (data.due_date) {
    page.drawText('DUE DATE', { x: rightColX + 10, y: currentY + 18, size: 7, font: fontBold, color: secondaryTextColor })
    page.drawText(format(new Date(data.due_date), 'dd MMM yyyy'), { x: rightColX + 10, y: currentY + 2, size: 10, font: fontBold, color: textColor })
  }

  const amountDueText = `R ${data.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  page.drawText('AMOUNT DUE', { x: width - 150, y: currentY + 18, size: 7, font: fontBold, color: secondaryTextColor })
  page.drawText(amountDueText, { x: width - 150, y: currentY + 2, size: 12, font: fontBold, color: secondaryColor })

  // 3. Items Table
  currentY -= 70
  
  // Table Header
  page.drawRectangle({
    x: 40,
    y: currentY - 5,
    width: width - 80,
    height: 30,
    color: textColor,
  })

  const cols = {
    desc: 55,
    qty: 350,
    price: 420,
    total: 510
  }

  const tableHeadY = currentY + 10
  const headSize = 9
  page.drawText('DESCRIPTION', { x: cols.desc, y: tableHeadY, size: headSize, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('QTY', { x: cols.qty, y: tableHeadY, size: headSize, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('PRICE', { x: cols.price, y: tableHeadY, size: headSize, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('TOTAL', { x: cols.total, y: tableHeadY, size: headSize, font: fontBold, color: rgb(1, 1, 1) })

  // Table Items
  currentY -= 35
  items.forEach((item: any, idx: number) => {
    if (currentY < 220) return // Stop earlier to leave room for totals

    if (idx % 2 === 1) {
      page.drawRectangle({
        x: 40,
        y: currentY - 10,
        width: width - 80,
        height: 30,
        color: lightBg,
      })
    }

    page.drawText(item.description || '', { x: cols.desc, y: currentY, size: 9, font: font, color: textColor, maxWidth: 280 })
    page.drawText(item.quantity?.toString() || '0', { x: cols.qty, y: currentY, size: 9, font: font, color: textColor })
    page.drawText(`R ${item.unit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, { x: cols.price, y: currentY, size: 9, font: font, color: textColor })
    
    const itemTotalText = `R ${item.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    page.drawText(itemTotalText, { 
      x: width - fontBold.widthOfTextAtSize(itemTotalText, 9) - 55, 
      y: currentY, 
      size: 9, 
      font: fontBold, 
      color: textColor 
    })

    currentY -= 30
  })

  // 4. Totals & Notes
  currentY -= 20
  
  // Notes Section (Left)
  if (data.notes) {
    let notesY = currentY
    page.drawText('NOTES & TERMS', { x: 40, y: notesY, size: 8, font: fontBold, color: primaryColor })
    page.drawText(data.notes, { 
      x: 40, 
      y: notesY - 15, 
      size: 9, 
      font: font, 
      color: secondaryTextColor, 
      maxWidth: 280,
      lineHeight: 12
    })
  }

  // Totals Section (Right)
  let totalsY = currentY
  const totalsLabelX = width - 260 // Moved further left to avoid overlap
  
  const addTotalRow = (label: string, value: string, isTotal = false, colorOverride?: any) => {
    const labelSize = isTotal ? 14 : 10
    const fontToUse = isTotal ? fontBold : font
    const colorToUse = colorOverride || (isTotal ? secondaryColor : secondaryTextColor)
    
    page.drawText(label, { x: totalsLabelX, y: totalsY, size: labelSize, font: fontBold, color: isTotal ? textColor : secondaryTextColor })
    
    const valueWidth = fontBold.widthOfTextAtSize(value, labelSize)
    page.drawText(value, { x: width - valueWidth - 55, y: totalsY, size: labelSize, font: fontBold, color: colorToUse })
    
    totalsY -= isTotal ? 30 : 20
  }

  addTotalRow('Subtotal', `R ${data.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  if (data.tax > 0) {
    addTotalRow(`Tax (${data.tax_rate}%)`, `R ${data.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  }
  if (data.discount > 0) {
    addTotalRow('Discount', `- R ${data.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  }

  totalsY -= 5
  page.drawLine({
    start: { x: totalsLabelX, y: totalsY + 15 },
    end: { x: width - 40, y: totalsY + 15 },
    thickness: 1,
    color: borderColor,
  })
  
  addTotalRow('TOTAL AMOUNT', `R ${data.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, true)

  // Outstanding Funds Received
  if (!isEstimate) {
    const isPaid = data.status === 'paid'
    addTotalRow('Funds Received', isPaid ? `R ${data.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'R 0.00', false, isPaid ? rgb(0.2, 0.6, 0.2) : secondaryTextColor)
    addTotalRow('Outstanding Amount', isPaid ? 'R 0.00' : `R ${data.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, false, isPaid ? secondaryTextColor : secondaryColor)
  }

  // 5. Payment Details Box
  if (profile.bank_name && profile.account_number) {
    const boxY = 60
    page.drawRectangle({
      x: 40,
      y: boxY,
      width: width - 80,
      height: 80,
      color: lightBg,
      borderColor: borderColor,
      borderWidth: 1,
    })

    page.drawText('PAYMENT INFORMATION', { x: 55, y: boxY + 60, size: 8, font: fontBold, color: primaryColor })
    
    const bankDetails = [
      `Bank: ${profile.bank_name}`,
      `Account: ${profile.account_number}`,
      `Holder: ${profile.account_holder || profile.business_name}`,
      `Branch: ${profile.branch_code || 'N/A'}`
    ]
    
    bankDetails.forEach((detail, i) => {
      page.drawText(detail, { x: 55, y: boxY + 42 - (i * 12), size: 8, font: font, color: textColor })
    })
  }

  const footerText = 'Thank you for choosing Get Stuffed Cookies!'
  page.drawText(footerText, { 
    x: width - fontBold.widthOfTextAtSize(footerText, 10) - 55, 
    y: 75, 
    size: 10, 
    font: fontBold, 
    color: secondaryColor 
  })

  // 6. Paid Status Visual (Watermark)
  if (data.status === 'paid') {
    const paidText = 'PAID'
    const paidSize = 80
    const textWidth = fontBold.widthOfTextAtSize(paidText, paidSize)
    
    page.drawText(paidText, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: paidSize,
      font: fontBold,
      color: rgb(0.2, 0.6, 0.2),
      opacity: 0.15,
      rotate: { type: 'degrees', angle: 30 },
    })
  }

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
