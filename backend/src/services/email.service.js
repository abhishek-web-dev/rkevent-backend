const nodemailer = require('nodemailer');

/**
 * Create SMTP Transporter.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: parseInt(process.env.SMTP_PORT || '2525', 10) === 465, // true for port 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email with the invoice PDF attached.
 * @param {string} toEmail - Recipient email address
 * @param {string} customerName - Name of the customer
 * @param {object} invoice - Invoice details object
 * @param {Buffer} pdfBuffer - Buffer of the invoice PDF
 * @returns {Promise<object>} Nodemailer send status
 */
const sendInvoiceEmail = async (toEmail, customerName, invoice, pdfBuffer) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'RK Event Invoice System';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@rkevent.com';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `New Invoice ${invoice.invoiceNumber} from ${fromName}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
          <h2 style="color: #1a1f36;">Invoice Notification</h2>
          <p>Dear ${customerName},</p>
          <p>We appreciate your business. Please find attached your invoice <strong>${invoice.invoiceNumber}</strong> issued on ${new Date(invoice.invoiceDate).toLocaleDateString()}.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Invoice Number</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Total Amount</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">$${invoice.totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Due Date</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; color: #c5221f; font-weight: bold;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Status</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; text-transform: uppercase;"><strong>${invoice.status}</strong></td>
            </tr>
          </table>

          <p>If you have any questions or concerns regarding this billing statement, please do not hesitate to contact us.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>${fromName}</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email Sending Service Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendInvoiceEmail,
};
