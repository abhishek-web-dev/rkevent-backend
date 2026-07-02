const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env config
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rk-event-invoice';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing collections...');
    await User.deleteMany();
    await CompanySettings.deleteMany();
    await Customer.deleteMany();
    await Invoice.deleteMany();
    await Payment.deleteMany();
    await ActivityLog.deleteMany();

    console.log('Seeding default administrator...');
    const adminUser = await User.create({
      name: 'RK Admin',
      email: 'admin@rkevent.com',
      password: 'adminpassword123', // Will be hashed automatically by pre-save hook
      role: 'admin',
    });

    const staffUser = await User.create({
      name: 'RK Staff User',
      email: 'staff@rkevent.com',
      password: 'staffpassword123',
      role: 'staff',
    });

    console.log('Seeding company settings...');
    const companySettings = await CompanySettings.create({
      companyName: 'RK Event Group',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      email: 'billing@rkevent.com',
      phone: '+91 99999 99999',
      address: 'RK Event Tower, Connaught Place, New Delhi - 110001',
      website: 'https://rkevent.com',
      invoicePrefix: 'RKE',
      invoiceStartNumber: 101,
    });

    console.log('Seeding mock customers...');
    const customer1 = await Customer.create({
      name: 'John Doe',
      companyName: 'Doe Corporate Rentals',
      email: 'johndoe@example.com',
      phone: '+1 555-0199',
      address: '742 Evergreen Terrace, Springfield',
      notes: 'Prefers emails over phone calls for invoice queries.',
    });

    const customer2 = await Customer.create({
      name: 'Jane Smith',
      companyName: 'Smith & Co Weddings',
      email: 'janesmith@smithweddings.com',
      phone: '+91 98765 43210',
      address: 'MG Road, Bangalore, Karnataka',
      notes: 'VIP customer, check deliverables before sending bills.',
    });

    console.log('Seeding invoices...');
    // Create Invoice 1 - Status will be Pending
    const invoice1 = new Invoice({
      invoiceNumber: 'RKE-0101',
      invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
      customer: customer1._id,
      notes: 'Payment is due within 15 days of invoice date.',
      discount: 50,
      items: [
        {
          title: 'Premium Sound System Rental',
          description: 'Includes subwoofers, line arrays, and audio engineering service.',
          quantity: 1,
          price: 500,
        },
        {
          title: 'Stage Lighting Set',
          description: 'LED lights, spotlights, and programming services.',
          quantity: 2,
          price: 150,
        },
      ],
    });
    await invoice1.save(); // pre-save hook calculates subtotal, total ($750), pending ($750)

    // Create Invoice 2 - Status will be Partial/Paid depending on payment
    const invoice2 = new Invoice({
      invoiceNumber: 'RKE-0102',
      invoiceDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future
      customer: customer2._id,
      notes: 'Standard wedding photography package.',
      discount: 200,
      items: [
        {
          title: 'Premium Event Photography Package',
          description: '10 hours coverage, 2 photographers, editing included.',
          quantity: 1,
          price: 2000,
        },
      ],
    });
    await invoice2.save(); // total = $1800

    // Create Invoice 3 - Overdue Invoice
    const invoice3 = new Invoice({
      invoiceNumber: 'RKE-0103',
      invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (already overdue)
      customer: customer1._id,
      notes: 'Late fee of 2% applicable after due date.',
      discount: 0,
      items: [
        {
          title: 'Decorations & Flower Arrangements',
          description: 'Floral stage decoration and table accents.',
          quantity: 1,
          price: 900,
        },
      ],
    });
    await invoice3.save(); // total = $900, status = Overdue

    console.log('Seeding payment entries...');
    // Create a payment for invoice 2
    const payment = await Payment.create({
      invoiceId: invoice2._id,
      amount: 1000,
      paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      transactionId: 'TXN1234567890',
      notes: 'Advance deposit received.',
    });

    // Update invoice2's paidAmount
    invoice2.paidAmount = 1000;
    await invoice2.save(); // status -> Partial (since paid < total)

    console.log('Seeding activity logs...');
    await ActivityLog.create([
      {
        userId: adminUser._id,
        action: 'User Login',
        details: 'RK Admin logged in successfully',
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser._id,
        action: 'Customer Created',
        details: `Customer ${customer1.name} created`,
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser._id,
        action: 'Invoice Created',
        details: `Invoice ${invoice1.invoiceNumber} created for ${customer1.name}`,
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser._id,
        action: 'Payment Received',
        details: `Payment of $${payment.amount} received for invoice ${invoice2.invoiceNumber}`,
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
