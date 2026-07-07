# RK Event Invoice Management System Backend

A production-ready, clean, and scalable backend for the "RK Event Invoice Management System". Built on Node.js, Express.js, and MongoDB, this application handles user authentication, company billing configuration, customer records, invoices (with auto-increment and status triggers), payment transactions, headless PDF invoice generations, email invoice notifications with PDF attachments, WhatsApp sharing link generation, and dashboard aggregations.

## Tech Stack
- **Runtime Environment:** Node.js
- **Framework:** Express.js (CommonJS syntax)
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT Authentication, bcryptjs, express-rate-limit
- **Services:** Cloudinary (Logo uploads), Puppeteer (PDF rendering), Nodemailer (Emails)
- **Validation:** Joi

---

## Folder Structure

```
backend/
├── src/
│   ├── config/          # Connection/integration configurations (MongoDB, Cloudinary, etc.)
│   ├── controllers/     # MVC controller handlers handling business logic
│   ├── middleware/      # Global error, authentication, validation, and rate limiters
│   ├── models/          # Mongoose database schema definitions
│   ├── routes/          # API route definitions grouped by model
│   ├── services/        # Service wrappers (Cloudinary, PDF, Email, Logger)
│   ├── templates/       # HTML template for PDF generation
│   ├── utils/           # Shared utilities (Response standards, Seeder script)
│   ├── validations/     # Joi validation rules
│   └── app.js           # Core Express configurations
├── server.js            # Main application boot script
├── .env.example         # Template config file
├── package.json         # Dependency configuration
└── README.md            # Setup guidelines
```

---

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or hosted via MongoDB Atlas)

### Step 1: Install Dependencies
Navigate to the backend directory and install standard dependencies:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Ensure you update the MongoDB connection string, JWT secret keys, Cloudinary credentials, and SMTP details for Nodemailer.

### Step 3: Run Database Seeder
Seed mock settings, users (admin/staff), customers, invoices, payments, and audit logs:
```bash
npm run seed
```
**Default Credentials Seeded:**
- **Admin:** `admin@rkevent.com` | Password: `adminpassword123`
- **Staff:** `staff@rkevent.com` | Password: `staffpassword123`

### Step 4: Run Application
- Run in production mode:
  ```bash
  npm start
  ```
- Run in development mode (with hot reloading via nodemon):
  ```bash
  npm run dev
  ```

---

## API Endpoints List

### 1. Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login, returns user credentials and JWT token
- `GET /profile` - Get authenticated user profile *(Requires Auth)*
- `PUT /profile` - Update profile name and email *(Requires Auth)*
- `PUT /change-password` - Modify account password *(Requires Auth)*

### 2. Company Settings (`/api/company`)
- `GET /` - Retrieve current company settings *(Requires Auth)*
- `PUT /` - Modify settings + logo image upload (`multipart/form-data`) *(Requires Admin Role)*

### 3. Customer Management (`/api/customers`)
- `POST /` - Register customer *(Requires Auth)*
- `GET /` - List customers with pagination & optional search query `?search=doe` *(Requires Auth)*
- `GET /:id` - Get specific customer detail *(Requires Auth)*
- `PUT /:id` - Update customer record *(Requires Auth)*
- `DELETE /:id` - Remove customer *(Requires Auth)*

### 4. Invoice Management (`/api/invoices`)
- `POST /` - Register invoice. Auto-calculates sums & generates sequential number *(Requires Auth)*
- `GET /` - List invoices with pagination, searches (`?search=RKE`), statuses (`?status=Pending`), and date ranges (`?startDate=2026-06-01&endDate=2026-07-01`) *(Requires Auth)*
- `GET /:id` - Retrieve specific invoice details *(Requires Auth)*
- `PUT /:id` - Modify invoice items or status (Auto-recalculates amounts) *(Requires Auth)*
- `DELETE /:id` - Remove invoice *(Requires Auth)*
- `GET /:id/pdf` - Download invoice as print-ready PDF *(Requires Auth)*
- `POST /:id/email` - Generate PDF and send to customer email as attachment *(Requires Auth)*
- `GET /:id/share-whatsapp` - Get WhatsApp sharing link pre-populated with details *(Requires Auth)*

### 5. Payments (`/api/payments`)
- `POST /` - Record transaction against invoice. Auto-adjusts balance & status *(Requires Auth)*
- `GET /` - List transaction history with pagination & optional `?invoiceId=...` filter *(Requires Auth)*
- `PUT /:id` - Modify payment amount or method (Auto-recomputes invoice totals) *(Requires Auth)*
- `DELETE /:id` - Remove payment (Deducts balance from invoice paid amounts) *(Requires Auth)*

### 6. Dashboard Analytics (`/api/dashboard`)
- `GET /` - Retrieve totals, balances, overdue counts, monthly sales history, and recent invoice listings *(Requires Auth)*
