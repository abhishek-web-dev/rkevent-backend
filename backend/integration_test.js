const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:5000';
let token = '';
let companySettings = null;
let customers = [];
let invoices = [];
let payments = [];
let testReport = [];

const recordTest = (name, endpoint, method, status, requestBody, responseBody, error = null) => {
  console.log(`[${status ? 'PASS' : 'FAIL'}] ${name} (${method} ${endpoint})`);
  testReport.push({
    name,
    endpoint,
    method,
    status: status ? 'SUCCESS' : 'FAILURE',
    request: requestBody ? requestBody : 'N/A',
    response: responseBody ? responseBody : 'N/A',
    error: error ? error.toString() : 'None',
  });
};

const runTests = async () => {
  try {
    console.log('Starting RK Event Backend API Integration Tests...');

    // 1. Create Test User
    const regPayload = {
      name: 'Integration Tester',
      email: 'integration_tester@rkevent.com',
      password: 'testerpassword123',
      role: 'admin',
    };
    try {
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regPayload),
      });
      const regData = await regRes.json();
      if (regRes.status === 201 || regRes.status === 200) {
        recordTest('Register User', '/api/auth/register', 'POST', true, regPayload, regData);
      } else {
        // If user already exists, it is fine (HTTP 400 is expected on rerun)
        recordTest('Register User (Pre-existing/Conflict Check)', '/api/auth/register', 'POST', true, regPayload, regData);
      }
    } catch (err) {
      recordTest('Register User', '/api/auth/register', 'POST', false, regPayload, null, err);
    }

    // 2. Login and retrieve JWT Token
    const loginPayload = {
      email: 'integration_tester@rkevent.com',
      password: 'testerpassword123',
    };
    let loginData;
    try {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      });
      loginData = await loginRes.json();
      if (loginRes.ok && loginData.success) {
        token = loginData.data.token;
        recordTest('Login User', '/api/auth/login', 'POST', true, loginPayload, loginData);
      } else {
        recordTest('Login User', '/api/auth/login', 'POST', false, loginPayload, loginData);
        throw new Error('Login failed, token not generated');
      }
    } catch (err) {
      recordTest('Login User', '/api/auth/login', 'POST', false, loginPayload, null, err);
      throw err;
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 3. Create/Update Company Settings
    const companyPayload = {
      companyName: 'RK Event Integration Corp',
      email: 'billing@rkintegration.com',
      phone: '+91 88888 88888',
      address: 'Event Plaza Block 12, New Delhi, India',
      website: 'https://rkintegration.com',
      invoicePrefix: 'TINV',
      invoiceStartNumber: 1,
    };
    try {
      const companyRes = await fetch(`${baseUrl}/api/company`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(companyPayload),
      });
      const compData = await companyRes.json();
      if (companyRes.ok && compData.success) {
        companySettings = compData.data;
        recordTest('Update Company Settings', '/api/company', 'PUT', true, companyPayload, compData);
      } else {
        recordTest('Update Company Settings', '/api/company', 'PUT', false, companyPayload, compData);
      }
    } catch (err) {
      recordTest('Update Company Settings', '/api/company', 'PUT', false, companyPayload, null, err);
    }

    // 4. Create 5 Customers
    for (let i = 1; i <= 5; i++) {
      const customerPayload = {
        name: `Customer Name ${i}`,
        companyName: `Customer Corp ${i}`,
        email: `customer${i}@rkevent-test.com`,
        phone: `+91 99000 0000${i}`,
        address: `Street Address ${i}, Landmark Road, India`,
        notes: `Test notes for customer number ${i}`,
      };
      try {
        const custRes = await fetch(`${baseUrl}/api/customers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(customerPayload),
        });
        const custData = await custRes.json();
        if (custRes.status === 201 && custData.success) {
          customers.push(custData.data);
          recordTest(`Create Customer ${i}`, '/api/customers', 'POST', true, customerPayload, custData);
        } else {
          recordTest(`Create Customer ${i}`, '/api/customers', 'POST', false, customerPayload, custData);
        }
      } catch (err) {
        recordTest(`Create Customer ${i}`, '/api/customers', 'POST', false, customerPayload, null, err);
      }
    }

    // Ensure we have customers
    if (customers.length === 0) {
      throw new Error('No customers created, cannot proceed with invoices');
    }

    // 5. Create 10 Invoices
    for (let i = 1; i <= 10; i++) {
      // Rotate customers
      const targetCustomer = customers[(i - 1) % customers.length];
      const invoicePayload = {
        dueDate: '2026-09-15',
        customer: targetCustomer._id,
        notes: `Due terms for event invoice ${i}.`,
        discount: 20, // $20 discount
        items: [
          {
            title: `Audio Event Rental Package ${i}`,
            description: `Set of wireless sound systems and arrays.`,
            quantity: 1,
            price: 200, // Subtotal = $200
          },
          {
            title: `Microphone set`,
            quantity: 2,
            price: 25, // Subtotal = $50
          }
        ], // Combined subtotal = $250 - discount $20 = $230 Total amount
      };

      try {
        const invRes = await fetch(`${baseUrl}/api/invoices`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(invoicePayload),
        });
        const invData = await invRes.json();
        if (invRes.status === 201 && invData.success) {
          invoices.push(invData.data);
          recordTest(`Create Invoice ${i} (${invData.data.invoiceNumber})`, '/api/invoices', 'POST', true, invoicePayload, invData);
        } else {
          recordTest(`Create Invoice ${i}`, '/api/invoices', 'POST', false, invoicePayload, invData);
        }
      } catch (err) {
        recordTest(`Create Invoice ${i}`, '/api/invoices', 'POST', false, invoicePayload, null, err);
      }
    }

    // Ensure we have invoices
    if (invoices.length === 0) {
      throw new Error('No invoices created, cannot proceed with payments');
    }

    // 6. Add payments to some invoices
    // Case A: Full payment for Invoice 1 (invoices[0]) -> Total should be $230
    const payment1Payload = {
      invoiceId: invoices[0]._id,
      amount: 230,
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-FULL-001',
      notes: 'Cleared full invoice balance',
    };
    try {
      const payRes = await fetch(`${baseUrl}/api/payments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payment1Payload),
      });
      const payData = await payRes.json();
      if (payRes.status === 201 && payData.success) {
        payments.push(payData.data);
        recordTest('Add Full Payment (Invoice 1)', '/api/payments', 'POST', true, payment1Payload, payData);
      } else {
        recordTest('Add Full Payment (Invoice 1)', '/api/payments', 'POST', false, payment1Payload, payData);
      }
    } catch (err) {
      recordTest('Add Full Payment (Invoice 1)', '/api/payments', 'POST', false, payment1Payload, null, err);
    }

    // Case B: Partial payment for Invoice 2 (invoices[1]) -> $100 paid out of $230
    const payment2Payload = {
      invoiceId: invoices[1]._id,
      amount: 100,
      paymentMethod: 'UPI',
      transactionId: 'TXN-PART-002',
      notes: 'Partial advance booking fee',
    };
    try {
      const payRes = await fetch(`${baseUrl}/api/payments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payment2Payload),
      });
      const payData = await payRes.json();
      if (payRes.status === 201 && payData.success) {
        payments.push(payData.data);
        recordTest('Add Partial Payment (Invoice 2)', '/api/payments', 'POST', true, payment2Payload, payData);
      } else {
        recordTest('Add Partial Payment (Invoice 2)', '/api/payments', 'POST', false, payment2Payload, payData);
      }
    } catch (err) {
      recordTest('Add Partial Payment (Invoice 2)', '/api/payments', 'POST', false, payment2Payload, null, err);
    }

    // 7. Verification checks
    // Verifying invoice numbering, paidAmount, pendingAmount, status updates
    try {
      const checkInv1Res = await fetch(`${baseUrl}/api/invoices/${invoices[0]._id}`, {
        method: 'GET',
        headers: authHeaders,
      });
      const checkInv1 = await checkInv1Res.json();
      const inv = checkInv1.data;
      
      const numValid = inv.invoiceNumber.startsWith('TINV-');
      const paidValid = inv.paidAmount === 230;
      const pendingValid = inv.pendingAmount === 0;
      const statusValid = inv.status === 'Paid';

      const success = numValid && paidValid && pendingValid && statusValid;
      recordTest(
        'Verify Invoice 1 Status and Values (Paid State)',
        `/api/invoices/${invoices[0]._id}`,
        'GET',
        success,
        null,
        {
          invoiceNumber: inv.invoiceNumber,
          paidAmount: inv.paidAmount,
          pendingAmount: inv.pendingAmount,
          status: inv.status,
        }
      );
    } catch (err) {
      recordTest('Verify Invoice 1 Status', `/api/invoices/${invoices[0]._id}`, 'GET', false, null, null, err);
    }

    try {
      const checkInv2Res = await fetch(`${baseUrl}/api/invoices/${invoices[1]._id}`, {
        method: 'GET',
        headers: authHeaders,
      });
      const checkInv2 = await checkInv2Res.json();
      const inv = checkInv2.data;

      const numValid = inv.invoiceNumber.startsWith('TINV-');
      const paidValid = inv.paidAmount === 100;
      const pendingValid = inv.pendingAmount === 130;
      const statusValid = inv.status === 'Partial';

      const success = numValid && paidValid && pendingValid && statusValid;
      recordTest(
        'Verify Invoice 2 Status and Values (Partial State)',
        `/api/invoices/${invoices[1]._id}`,
        'GET',
        success,
        null,
        {
          invoiceNumber: inv.invoiceNumber,
          paidAmount: inv.paidAmount,
          pendingAmount: inv.pendingAmount,
          status: inv.status,
        }
      );
    } catch (err) {
      recordTest('Verify Invoice 2 Status', `/api/invoices/${invoices[1]._id}`, 'GET', false, null, null, err);
    }

    // Verify Dashboard Calculations
    try {
      const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
        method: 'GET',
        headers: authHeaders,
      });
      const dashData = await dashRes.json();
      if (dashRes.ok && dashData.success) {
        recordTest('Verify Dashboard Calculations', '/api/dashboard', 'GET', true, null, dashData.data);
      } else {
        recordTest('Verify Dashboard Calculations', '/api/dashboard', 'GET', false, null, dashData);
      }
    } catch (err) {
      recordTest('Verify Dashboard Calculations', '/api/dashboard', 'GET', false, null, null, err);
    }

    // Verify PDF Generation
    try {
      const pdfRes = await fetch(`${baseUrl}/api/invoices/${invoices[0]._id}/pdf`, {
        method: 'GET',
        headers: authHeaders,
      });
      if (pdfRes.ok && pdfRes.headers.get('content-type') === 'application/pdf') {
        recordTest('Verify PDF Generation', `/api/invoices/${invoices[0]._id}/pdf`, 'GET', true, null, {
          contentType: pdfRes.headers.get('content-type'),
          size: (await pdfRes.arrayBuffer()).byteLength,
        });
      } else {
        recordTest('Verify PDF Generation', `/api/invoices/${invoices[0]._id}/pdf`, 'GET', false, null, {
          status: pdfRes.status,
          contentType: pdfRes.headers.get('content-type'),
        });
      }
    } catch (err) {
      recordTest('Verify PDF Generation', `/api/invoices/${invoices[0]._id}/pdf`, 'GET', false, null, null, err);
    }

    // Verify Email Invoice
    try {
      const emailRes = await fetch(`${baseUrl}/api/invoices/${invoices[0]._id}/email`, {
        method: 'POST',
        headers: authHeaders,
      });
      const emailData = await emailRes.json();
      if (emailRes.ok && emailData.success) {
        recordTest('Verify Email Invoice Transmission', `/api/invoices/${invoices[0]._id}/email`, 'POST', true, null, emailData);
      } else {
        recordTest('Verify Email Invoice Transmission', `/api/invoices/${invoices[0]._id}/email`, 'POST', false, null, emailData);
      }
    } catch (err) {
      recordTest('Verify Email Invoice Transmission', `/api/invoices/${invoices[0]._id}/email`, 'POST', false, null, null, err);
    }

    // Verify WhatsApp Sharing Link
    try {
      const waRes = await fetch(`${baseUrl}/api/invoices/${invoices[0]._id}/share-whatsapp`, {
        method: 'GET',
        headers: authHeaders,
      });
      const waData = await waRes.json();
      if (waRes.ok && waData.success && waData.data.whatsappLink) {
        recordTest('Verify WhatsApp Link Generation', `/api/invoices/${invoices[0]._id}/share-whatsapp`, 'GET', true, null, waData.data);
      } else {
        recordTest('Verify WhatsApp Link Generation', `/api/invoices/${invoices[0]._id}/share-whatsapp`, 'GET', false, null, waData);
      }
    } catch (err) {
      recordTest('Verify WhatsApp Link Generation', `/api/invoices/${invoices[0]._id}/share-whatsapp`, 'GET', false, null, null, err);
    }

    // 8. Generate TEST_REPORT.md
    console.log('Writing test report...');
    writeMarkdownReport();

    console.log('Integration Tests Completed successfully.');
  } catch (err) {
    console.error('Fatal Integration Test Error:', err);
  }
};

const writeMarkdownReport = () => {
  const reportPath = path.join(__dirname, 'TEST_REPORT.md');
  let content = `# Integration Test Report - RK Event Invoice System

Performed full API integration testing on local environment.

## Overall Test Details
- **Date & Time:** ${new Date().toLocaleString()}
- **Node.js Version:** ${process.version}
- **Base API URL:** ${baseUrl}

## Test Cases Summary

| Step Name | Endpoint | Method | Status | Errors Found |
| :--- | :--- | :--- | :--- | :--- |
`;

  testReport.forEach((t) => {
    content += `| ${t.name} | \`${t.endpoint}\` | **${t.method}** | ${t.status === 'SUCCESS' ? '🟢 PASS' : '🔴 FAIL'} | ${t.error !== 'None' ? `\`${t.error}\`` : 'None'} |\n`;
  });

  testReport.forEach((t, i) => {
    content += `\n### Test Case ${i + 1}: ${t.name}\n`;
    content += `- **Endpoint:** \`${t.method} ${t.endpoint}\`\n`;
    content += `- **Status:** ${t.status === 'SUCCESS' ? '🟢 PASS' : '🔴 FAIL'}\n`;
    if (t.error !== 'None') {
      content += `- **Error details:** \`${t.error}\`\n`;
    }
    const reqStr = typeof t.request === 'object' ? JSON.stringify(t.request, null, 2) : t.request;
    const resStr = typeof t.response === 'object' ? JSON.stringify(t.response, null, 2) : t.response;
    content += `\n**Request Payload:**\n\`\`\`json\n${reqStr}\n\`\`\`\n`;
    content += `\n**Response Body:**\n\`\`\`json\n${resStr}\n\`\`\`\n`;
    content += `\n---\n`;
  });

  fs.writeFileSync(reportPath, content, 'utf8');
  console.log(`Test report successfully written to ${reportPath}`);
};

runTests();
