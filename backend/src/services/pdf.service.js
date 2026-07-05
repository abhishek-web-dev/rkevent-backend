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

    // 1. Prepare Logo HTML with Base64 load fallback
    let logoHtml = '';
    try {
      if (fs.existsSync('E:\\Projects\\RK-Event\\logo-white.png')) {
        const logoBuffer = fs.readFileSync('E:\\Projects\\RK-Event\\logo-white.png');
        const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        logoHtml = `<img src="${logoBase64}" alt="${companySettings.companyName}" style="max-height: 95px; max-width: 290px; object-fit: contain;">`;
      } else if (companySettings.companyLogo) {
        logoHtml = `<img src="${companySettings.companyLogo}" alt="${companySettings.companyName}" style="max-height: 95px; max-width: 290px; object-fit: contain;">`;
      } else {
        logoHtml = `<div style="font-size: 22px; font-weight: 800; color: #681AA7; border: 2px solid #681AA7; padding: 5px 12px; display: inline-block;">${companySettings.companyName.substring(0, 3).toUpperCase()}</div>`;
      }
    } catch (logoErr) {
      logoHtml = `<div style="font-size: 22px; font-weight: 800; color: #681AA7; border: 2px solid #681AA7; padding: 5px 12px; display: inline-block;">${companySettings.companyName.substring(0, 3).toUpperCase()}</div>`;
    }

    // 2. Prepare Status Badge Class
    let statusBadgeClass = 'status-pending';
    if (invoice.status === 'Paid') statusBadgeClass = 'status-paid';
    else if (invoice.status === 'Partial') statusBadgeClass = 'status-partial';
    else if (invoice.status === 'Overdue') statusBadgeClass = 'status-overdue';

    // 3. Compile invoice items rows (columns: #, Service, Qty, Rate, Amount)
    let itemsHtmlRows = '';
    invoice.items.forEach((item, index) => {
      itemsHtmlRows += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="font-weight: 600; color: #2D3748;">${item.serviceName || item.title || ''}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.price)}</td>
          <td style="text-align: right; font-weight: 700; color: #2D3748;">${formatCurrency(item.amount)}</td>
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

    // 5. Prepare Signature Image HTML with Base64 fallback
    let signatureHtml = '';
    try {
      if (fs.existsSync('E:\\Projects\\RK-Event\\signature.png')) {
        const sigBuffer = fs.readFileSync('E:\\Projects\\RK-Event\\signature.png');
        const sigBase64 = `data:image/png;base64,${sigBuffer.toString('base64')}`;
        signatureHtml = `<img src="${sigBase64}" alt="Signature" style="max-height: 55px; max-width: 140px; object-fit: contain;">`;
      } else if (companySettings.signatureUrl) {
        signatureHtml = `<img src="${companySettings.signatureUrl}" alt="Signature" style="max-height: 55px; max-width: 140px; object-fit: contain;">`;
      }
    } catch (sigErr) {
      console.warn('Could not render signature buffer:', sigErr.message);
    }

    // 6. Inject variables into template
    // 6. Inject variables into template
    const placeholders = {
      '{{invoiceNumber}}': invoice.invoiceNumber,
      '{{logoHtml}}': logoHtml,
      '{{companyName}}': companySettings.companyName,
      '{{companyAddress}}': (companySettings.address && typeof companySettings.address === 'string') ? companySettings.address.replace(/\n/g, '<br>') : '',
      '{{companyPhone}}': companySettings.phone || '',
      '{{companyEmail}}': companySettings.email || '',
      '{{ownerName}}': companySettings.ownerName || 'Rahul Kumar',
      '{{upiId}}': upiId,
      '{{customerName}}': invoice.customer ? invoice.customer.name : (invoice.customerDetails ? invoice.customerDetails.name : 'N/A'),
      '{{customerPhone}}': invoice.customer ? invoice.customer.phone : (invoice.customerDetails ? invoice.customerDetails.phone : 'N/A'),
      '{{customerAlternatePhone}}': (invoice.customer && invoice.customer.alternatePhone) ? `<p class="card-text"><strong>Alt Phone:</strong> ${invoice.customer.alternatePhone}</p>` : ((invoice.customerDetails && invoice.customerDetails.alternatePhone) ? `<p class="card-text"><strong>Alt Phone:</strong> ${invoice.customerDetails.alternatePhone}</p>` : ''),
      '{{customerEmail}}': (invoice.customer && invoice.customer.email) ? `<p class="card-text"><strong>Email:</strong> ${invoice.customer.email}</p>` : ((invoice.customerDetails && invoice.customerDetails.email) ? `<p class="card-text"><strong>Email:</strong> ${invoice.customerDetails.email}</p>` : ''),
      '{{customerAddress}}': (invoice.customer && invoice.customer.address && typeof invoice.customer.address === 'string') ? invoice.customer.address.replace(/\n/g, '<br>') : ((invoice.customerDetails && invoice.customerDetails.address && typeof invoice.customerDetails.address === 'string') ? invoice.customerDetails.address.replace(/\n/g, '<br>') : ''),
      '{{customerCity}}': invoice.customer ? (invoice.customer.city || '') : (invoice.customerDetails ? (invoice.customerDetails.city || '') : ''),
      '{{customerState}}': invoice.customer ? (invoice.customer.state || '') : (invoice.customerDetails ? (invoice.customerDetails.state || '') : ''),
      '{{customerPincode}}': invoice.customer ? (invoice.customer.pincode || '') : (invoice.customerDetails ? (invoice.customerDetails.pincode || '') : ''),
      '{{invoiceDate}}': formatDate(invoice.invoiceDate),
      '{{dueDate}}': formatDate(invoice.dueDate),
      
      // Event Info
      '{{eventType}}': invoice.eventType || 'N/A',
      '{{eventDate}}': invoice.eventDate ? formatDate(invoice.eventDate) : 'N/A',
      '{{eventTime}}': invoice.eventTime || 'N/A',
      '{{eventLocation}}': invoice.eventLocation || 'N/A',
      '{{expectedGuestCount}}': invoice.expectedGuestCount ? `<p class="card-label">Expected Guest Count</p><p class="card-text">${invoice.expectedGuestCount}</p>` : '',
      '{{specialRequirements}}': invoice.specialRequirements ? `<p class="card-label">Client Requirements / Notes</p><p class="card-text" style="font-style: italic;">${invoice.specialRequirements}</p>` : '',
      
      // Payment Tally Details
      '{{tokenAmount}}': formatCurrency(invoice.tokenAmount || 0),
      '{{advancePaid}}': formatCurrency(invoice.paidAmount || 0),
      '{{remainingAmount}}': formatCurrency(invoice.pendingAmount || 0),
      '{{paymentMode}}': invoice.paymentMode || 'N/A',
      
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
