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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
      // Default textual logo if no image uploaded
      logoHtml = `<div style="font-size: 24px; font-weight: 800; color: #1a1f36; border: 2px solid #1a1f36; padding: 5px 15px; display: inline-block;">${companySettings.companyName.substring(0, 3).toUpperCase()}</div>`;
    }

    // 2. Prepare Status Badge Class
    let statusBadgeClass = 'status-pending';
    if (invoice.status === 'Paid') statusBadgeClass = 'status-paid';
    else if (invoice.status === 'Partial') statusBadgeClass = 'status-partial';
    else if (invoice.status === 'Overdue') statusBadgeClass = 'status-overdue';

    // 3. Compile invoice items rows
    let itemsHtmlRows = '';
    invoice.items.forEach((item, index) => {
      itemsHtmlRows += `
        <tr>
          <td>${index + 1}</td>
          <td>
            <p class="item-title">${item.title}</p>
            ${item.description ? `<p class="item-desc">${item.description}</p>` : ''}
          </td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.price)}</td>
          <td class="text-right">${formatCurrency(item.amount)}</td>
        </tr>
      `;
    });

    // 4. Inject variables into template
    const placeholders = {
      '{{invoiceNumber}}': invoice.invoiceNumber,
      '{{logoHtml}}': logoHtml,
      '{{companyName}}': companySettings.companyName,
      '{{companyAddress}}': companySettings.address.replace(/\n/g, '<br>'),
      '{{companyPhone}}': companySettings.phone,
      '{{companyEmail}}': companySettings.email,
      '{{companyWebsite}}': companySettings.website ? companySettings.website : '',
      '{{customerName}}': invoice.customer.name,
      '{{customerCompanyName}}': invoice.customer.companyName ? invoice.customer.companyName : '',
      '{{customerAddress}}': invoice.customer.address.replace(/\n/g, '<br>'),
      '{{customerPhone}}': invoice.customer.phone,
      '{{customerEmail}}': invoice.customer.email,
      '{{invoiceDate}}': formatDate(invoice.invoiceDate),
      '{{dueDate}}': formatDate(invoice.dueDate),
      '{{status}}': invoice.status,
      '{{statusBadgeClass}}': statusBadgeClass,
      '{{invoiceItemsRows}}': itemsHtmlRows,
      '{{notes}}': invoice.notes || 'N/A',
      '{{subtotal}}': formatCurrency(invoice.subtotal),
      '{{discount}}': formatCurrency(invoice.discount),
      '{{totalAmount}}': formatCurrency(invoice.totalAmount),
      '{{paidAmount}}': formatCurrency(invoice.paidAmount),
      '{{pendingAmount}}': formatCurrency(invoice.pendingAmount),
    };

    Object.keys(placeholders).forEach((key) => {
      htmlContent = htmlContent.replaceAll(key, placeholders[key]);
    });

    // 5. Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: true, // headless: true is compatible with newer versions
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
