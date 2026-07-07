require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Service = require('../src/models/Service');

const STANDARD_SERVICES = [
  {
    name: 'Premium Wedding Album',
    description: 'High-quality wedding shoot photo album with custom covers and pages layout',
    basePrice: 15000,
    isActive: true,
    workflows: ['Photo Selection', 'Album Design', 'Client Approval', 'Printing', 'Ready', 'Delivered'],
    fields: [
      {
        name: 'dimensions',
        label: 'Album Size/Dimensions',
        type: 'Dropdown',
        required: true,
        defaultValue: '12x36',
        validation: {
          options: ['12x36', '12x30', '30x40', '15x20']
        },
        order: 0
      },
      {
        name: 'pages',
        label: 'Number of Pages',
        type: 'Number',
        required: true,
        defaultValue: '40',
        validation: { min: 20, max: 100 },
        order: 1
      },
      {
        name: 'photosCount',
        label: 'Number of Photos Selected',
        type: 'Number',
        required: true,
        defaultValue: '120',
        validation: { min: 50, max: 300 },
        order: 2
      },
      {
        name: 'coverType',
        label: 'Cover Type/Finish',
        type: 'Dropdown',
        required: false,
        defaultValue: 'Matte Leather',
        validation: {
          options: ['Matte Leather', 'Glossy Glass', 'Premium Velvet', 'Standard Acrylic']
        },
        order: 3
      }
    ]
  },
  {
    name: 'Traditional Video Deliverables',
    description: 'Traditional full-length wedding documentation recording and editing',
    basePrice: 20000,
    isActive: true,
    workflows: ['Footage Received', 'Editing', 'Music Sync', 'Review', 'Export', 'Delivered'],
    fields: [
      {
        name: 'duration',
        label: 'Video Duration (Hours)',
        type: 'Number',
        required: true,
        defaultValue: '2',
        validation: { min: 1, max: 5 },
        order: 0
      },
      {
        name: 'penDrive',
        label: 'Deliver via Pen Drive storage',
        type: 'Switch',
        required: false,
        defaultValue: 'true',
        validation: {},
        order: 1
      }
    ]
  },
  {
    name: 'Cinematic Movie & Reels',
    description: 'Modern cinematic visual movie teaser and customized Instagram reels coverage',
    basePrice: 35000,
    isActive: true,
    workflows: ['Editing', 'Color Grading', 'Sound Design', 'Review', 'Delivered'],
    fields: [
      {
        name: 'duration',
        label: 'Cinematic Movie Duration (Mins)',
        type: 'Number',
        required: true,
        defaultValue: '30',
        validation: { min: 10, max: 60 },
        order: 0
      },
      {
        name: 'reelsCount',
        label: 'Number of Instagram Reels',
        type: 'Number',
        required: true,
        defaultValue: '3',
        validation: { min: 1, max: 10 },
        order: 1
      },
      {
        name: 'droneShot',
        label: 'Aerial/Drone Coverage Included',
        type: 'Switch',
        required: false,
        defaultValue: 'true',
        validation: {},
        order: 2
      }
    ]
  }
];

const seedServices = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing old duplicate dynamic services configurations...');
    for (const service of STANDARD_SERVICES) {
      // Find and delete existing standard templates to allow clean update
      await Service.deleteMany({ name: service.name });
    }

    console.log('Inserting standard studio services...');
    const created = await Service.insertMany(STANDARD_SERVICES);
    console.log(`Successfully seeded ${created.length} dynamic services!`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedServices();
