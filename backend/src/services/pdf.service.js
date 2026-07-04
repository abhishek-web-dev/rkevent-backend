const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Format date to a readable string (e.g. July 2, 2026)
 * @param {Date|string} dateVal 
 * @returns {string}
 */
const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format number to currency style (e.g., $1,250.00)
 * @param {number} amount 
 * @returns {string}
 */
const formatCurrency = (amount) => {
  const parsed = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(parsed);
};

/**
 * Generate PDF buffer for a specific invoice.
 * @param {object} invoice - The populated invoice document
 * @param {object} companySettings - Company settings document
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePdf = async (invoice, companySettings) => {
  let browser;
  try {
    const templatePath = path.join(__dirname, '../templates/invoice-template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // 1. Prepare Logo HTML
    let logoHtml = '';
    if (companySettings.companyLogo) {
      logoHtml = `<img src="${companySettings.companyLogo}" alt="${companySettings.companyName}">`;
    } else {
      logoHtml = `<div style="font-size: 22px; font-weight: 800; color: #681AA7; border: 2px solid #681AA7; padding: 5px 12px; display: inline-block;">${companySettings.companyName.substring(0, 3).toUpperCase()}</div>`;
    }

    // 2. Prepare Status Badge Class
    let statusBadgeClass = 'status-pending';
    if (invoice.status === 'Paid') statusBadgeClass = 'status-paid';
    else if (invoice.status === 'Partial') statusBadgeClass = 'status-partial';
    else if (invoice.status === 'Overdue') statusBadgeClass = 'status-overdue';

    // 3. Compile invoice items rows with category column
    let itemsHtmlRows = '';
    invoice.items.forEach((item, index) => {
      itemsHtmlRows += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>
            <span class="item-title" style="font-weight: 600;">${item.serviceName || item.title || ''}</span>
          </td>
          <td style="text-align: center;">${item.category || 'N/A'}</td>
          <td>${item.description || '-'}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.price)}</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
        </tr>
      `;
    });

    // 4. Generate UPI QR Code URL
    const upiId = companySettings.upiId || '9169659965-5@ybl';
    const ownerName = companySettings.ownerName || 'Rahul Kumar';
    const upiAmount = invoice.pendingAmount || 0;
    const upiNote = `Invoice-${invoice.invoiceNumber}`;
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(ownerName)}&am=${upiAmount}&tn=${encodeURIComponent(upiNote)}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;

    // 5. Prepare Signature Image HTML
    let signatureHtml = '';
    if (companySettings.signatureUrl) {
      signatureHtml = `<img src="${companySettings.signatureUrl}" alt="Signature" style="max-height: 50px; max-width: 120px; object-fit: contain;">`;
    }

    // 6. Inject variables into template
    // 6. Inject variables into template
    const placeholders = {
      '{{invoiceNumber}}': invoice.invoiceNumber,
      '{{logoHtml}}': logoHtml,
      '{{companyName}}': companySettings.companyName,
      '{{companyAddress}}': companySettings.address ? companySettings.address.replace(/\n/g, '<br>') : '',
      '{{companyPhone}}': companySettings.phone,
      '{{companyEmail}}': companySettings.email,
      '{{ownerName}}': companySettings.ownerName || 'Rahul Kumar',
      '{{upiId}}': upiId,
      '{{customerName}}': invoice.customer ? invoice.customer.name : 'N/A',
      '{{customerPhone}}': invoice.customer ? invoice.customer.phone : 'N/A',
      '{{customerAlternatePhone}}': invoice.customer && invoice.customer.alternatePhone ? `<p class="info-subtext">Alt Phone: ${invoice.customer.alternatePhone}</p>` : '',
      '{{customerEmail}}': invoice.customer && invoice.customer.email ? `<p class="info-subtext">Email: ${invoice.customer.email}</p>` : '',
      '{{customerAddress}}': invoice.customer && invoice.customer.address ? invoice.customer.address.replace(/\n/g, '<br>') : '',
      '{{customerCity}}': invoice.customer && invoice.customer.city ? invoice.customer.city : '',
      '{{customerState}}': invoice.customer && invoice.customer.state ? invoice.customer.state : '',
      '{{customerPincode}}': invoice.customer && invoice.customer.pincode ? invoice.customer.pincode : '',
      '{{invoiceDate}}': formatDate(invoice.invoiceDate),
      '{{dueDate}}': formatDate(invoice.dueDate),
      
      // Event Info
      '{{eventType}}': invoice.eventType || 'N/A',
      '{{eventDate}}': invoice.eventDate ? formatDate(invoice.eventDate) : 'N/A',
      '{{eventTime}}': invoice.eventTime || 'N/A',
      '{{eventLocation}}': invoice.eventLocation || 'N/A',
      '{{expectedGuestCount}}': invoice.expectedGuestCount ? `<p class="info-label" style="margin-top: 6px;">Expected Guest Count</p><p class="info-value" style="margin-bottom: 0;">${invoice.expectedGuestCount}</p>` : '',
      '{{specialRequirements}}': invoice.specialRequirements ? `<p class="info-label" style="margin-top: 6px;">Special Requirements</p><p class="info-subtext" style="font-style: italic;">${invoice.specialRequirements}</p>` : '',
      
      // Payment Tally Details
      '{{tokenAmount}}': formatCurrency(invoice.tokenAmount || 0),
      '{{advancePaid}}': formatCurrency(invoice.advancePaid || 0),
      '{{remainingAmount}}': formatCurrency(invoice.remainingAmount || 0),
      '{{paymentMode}}': invoice.paymentMode ? `<tr><td class="totals-label">Payment Mode:</td><td class="totals-value" style="text-transform: uppercase;">${invoice.paymentMode}</td></tr>` : '',
      
      '{{status}}': invoice.status,
      '{{statusBadgeClass}}': statusBadgeClass,
      '{{invoiceItemsRows}}': itemsHtmlRows,
      '{{notes}}': invoice.notes ? `<p style="margin-top: 6px; font-style: italic;">Note: ${invoice.notes}</p>` : '',
      '{{subtotal}}': formatCurrency(invoice.subtotal),
      '{{discount}}': formatCurrency(invoice.discount),
      '{{totalAmount}}': formatCurrency(invoice.totalAmount),
      '{{paidAmount}}': formatCurrency(invoice.paidAmount),
      '{{pendingAmount}}': formatCurrency(invoice.pendingAmount),
      '{{qrCodeUrl}}': qrCodeUrl,
      '{{signatureHtml}}': signatureHtml,
    };

    Object.keys(placeholders).forEach((key) => {
      htmlContent = htmlContent.replaceAll(key, placeholders[key]);
    });

    // 5. Generate PDF using Puppeteer
    const executablePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : undefined;

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport and content
    await page.setViewport({ width: 800, height: 1130 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error(`PDF Generation Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateInvoicePdf,
};
