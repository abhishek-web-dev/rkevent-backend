# Integration Test Report - RK Event Invoice System

Performed full API integration testing on local environment.

## Overall Test Details
- **Date & Time:** 2/7/2026, 3:39:54 pm
- **Node.js Version:** v24.16.0
- **Base API URL:** http://localhost:5000

## Test Cases Summary

| Step Name | Endpoint | Method | Status | Errors Found |
| :--- | :--- | :--- | :--- | :--- |
| Register User (Pre-existing/Conflict Check) | `/api/auth/register` | **POST** | 🟢 PASS | None |
| Login User | `/api/auth/login` | **POST** | 🟢 PASS | None |
| Update Company Settings | `/api/company` | **PUT** | 🟢 PASS | None |
| Create Customer 1 | `/api/customers` | **POST** | 🟢 PASS | None |
| Create Customer 2 | `/api/customers` | **POST** | 🟢 PASS | None |
| Create Customer 3 | `/api/customers` | **POST** | 🟢 PASS | None |
| Create Customer 4 | `/api/customers` | **POST** | 🟢 PASS | None |
| Create Customer 5 | `/api/customers` | **POST** | 🟢 PASS | None |
| Create Invoice 1 (TINV-0081) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 2 (TINV-0082) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 3 (TINV-0083) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 4 (TINV-0084) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 5 (TINV-0085) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 6 (TINV-0086) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 7 (TINV-0087) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 8 (TINV-0088) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 9 (TINV-0089) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Create Invoice 10 (TINV-0090) | `/api/invoices` | **POST** | 🟢 PASS | None |
| Add Full Payment (Invoice 1) | `/api/payments` | **POST** | 🟢 PASS | None |
| Add Partial Payment (Invoice 2) | `/api/payments` | **POST** | 🟢 PASS | None |
| Verify Invoice 1 Status and Values (Paid State) | `/api/invoices/6a4638de85c08633858cad39` | **GET** | 🟢 PASS | None |
| Verify Invoice 2 Status and Values (Partial State) | `/api/invoices/6a4638df85c08633858cad45` | **GET** | 🟢 PASS | None |
| Verify Dashboard Calculations | `/api/dashboard` | **GET** | 🟢 PASS | None |
| Verify PDF Generation | `/api/invoices/6a4638de85c08633858cad39/pdf` | **GET** | 🟢 PASS | None |
| Verify Email Invoice Transmission | `/api/invoices/6a4638de85c08633858cad39/email` | **POST** | 🟢 PASS | None |
| Verify WhatsApp Link Generation | `/api/invoices/6a4638de85c08633858cad39/share-whatsapp` | **GET** | 🟢 PASS | None |

### Test Case 1: Register User (Pre-existing/Conflict Check)
- **Endpoint:** `POST /api/auth/register`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "name": "Integration Tester",
  "email": "integration_tester@rkevent.com",
  "password": "testerpassword123",
  "role": "admin"
}
```

**Response Body:**
```json
{
  "success": false,
  "message": "User with this email already exists",
  "errors": [],
  "stack": "Error: User with this email already exists\n    at register (E:\\Projects\\RK-Event\\backend\\src\\controllers\\auth.controller.js:27:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)"
}
```

---

### Test Case 2: Login User
- **Endpoint:** `POST /api/auth/login`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "email": "integration_tester@rkevent.com",
  "password": "testerpassword123"
}
```

**Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "6a4633775ca36bc48dbd6bc2",
      "name": "Integration Tester",
      "email": "integration_tester@rkevent.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNDYzMzc3NWNhMzZiYzQ4ZGJkNmJjMiIsImlhdCI6MTc4Mjk4Njk3MywiZXhwIjoxNzgzNTkxNzczfQ.a6x1YwnLviGTPlYCgHAgZsLPx5jg24czjtib-khlgSY"
  },
  "message": "Logged in successfully",
  "success": true
}
```

---

### Test Case 3: Update Company Settings
- **Endpoint:** `PUT /api/company`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "companyName": "RK Event Integration Corp",
  "email": "billing@rkintegration.com",
  "phone": "+91 88888 88888",
  "address": "Event Plaza Block 12, New Delhi, India",
  "website": "https://rkintegration.com",
  "invoicePrefix": "TINV",
  "invoiceStartNumber": 1
}
```

**Response Body:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "6a4633775ca36bc48dbd6bcb",
    "companyName": "RK Event Integration Corp",
    "companyLogo": "",
    "email": "billing@rkintegration.com",
    "phone": "+91 88888 88888",
    "address": "Event Plaza Block 12, New Delhi, India",
    "website": "https://rkintegration.com",
    "invoicePrefix": "TINV",
    "invoiceStartNumber": 1,
    "createdAt": "2026-07-02T09:46:31.956Z",
    "updatedAt": "2026-07-02T09:46:31.956Z",
    "__v": 0
  },
  "message": "Company settings updated successfully",
  "success": true
}
```

---

### Test Case 4: Create Customer 1
- **Endpoint:** `POST /api/customers`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "name": "Customer Name 1",
  "companyName": "Customer Corp 1",
  "email": "customer1@rkevent-test.com",
  "phone": "+91 99000 00001",
  "address": "Street Address 1, Landmark Road, India",
  "notes": "Test notes for customer number 1"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "name": "Customer Name 1",
    "companyName": "Customer Corp 1",
    "email": "customer1@rkevent-test.com",
    "phone": "+91 99000 00001",
    "address": "Street Address 1, Landmark Road, India",
    "notes": "Test notes for customer number 1",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638dd85c08633858cad1b",
    "createdAt": "2026-07-02T10:09:33.928Z",
    "updatedAt": "2026-07-02T10:09:33.928Z",
    "__v": 0
  },
  "message": "Customer created successfully",
  "success": true
}
```

---

### Test Case 5: Create Customer 2
- **Endpoint:** `POST /api/customers`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "name": "Customer Name 2",
  "companyName": "Customer Corp 2",
  "email": "customer2@rkevent-test.com",
  "phone": "+91 99000 00002",
  "address": "Street Address 2, Landmark Road, India",
  "notes": "Test notes for customer number 2"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "name": "Customer Name 2",
    "companyName": "Customer Corp 2",
    "email": "customer2@rkevent-test.com",
    "phone": "+91 99000 00002",
    "address": "Street Address 2, Landmark Road, India",
    "notes": "Test notes for customer number 2",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638de85c08633858cad20",
    "createdAt": "2026-07-02T10:09:34.043Z",
    "updatedAt": "2026-07-02T10:09:34.043Z",
    "__v": 0
  },
  "message": "Customer created successfully",
  "success": true
}
```

---

### Test Case 6: Create Customer 3
- **Endpoint:** `POST /api/customers`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "name": "Customer Name 3",
  "companyName": "Customer Corp 3",
  "email": "customer3@rkevent-test.com",
  "phone": "+91 99000 00003",
  "address": "Street Address 3, Landmark Road, India",
  "notes": "Test notes for customer number 3"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "name": "Customer Name 3",
    "companyName": "Customer Corp 3",
    "email": "customer3@rkevent-test.com",
    "phone": "+91 99000 00003",
    "address": "Street Address 3, Landmark Road, India",
    "notes": "Test notes for customer number 3",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638de85c08633858cad25",
    "createdAt": "2026-07-02T10:09:34.185Z",
    "updatedAt": "2026-07-02T10:09:34.185Z",
    "__v": 0
  },
  "message": "Customer created successfully",
  "success": true
}
```

---

### Test Case 7: Create Customer 4
- **Endpoint:** `POST /api/customers`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "name": "Customer Name 4",
  "companyName": "Customer Corp 4",
  "email": "customer4@rkevent-test.com",
  "phone": "+91 99000 00004",
  "address": "Street Address 4, Landmark Road, India",
  "notes": "Test notes for customer number 4"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "name": "Customer Name 4",
    "companyName": "Customer Corp 4",
    "email": "customer4@rkevent-test.com",
    "phone": "+91 99000 00004",
    "address": "Street Address 4, Landmark Road, India",
    "notes": "Test notes for customer number 4",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638de85c08633858cad2a",
    "createdAt": "2026-07-02T10:09:34.321Z",
    "updatedAt": "2026-07-02T10:09:34.321Z",
    "__v": 0
  },
  "message": "Customer created successfully",
  "success": true
}
```

---

### Test Case 8: Create Customer 5
- **Endpoint:** `POST /api/customers`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "name": "Customer Name 5",
  "companyName": "Customer Corp 5",
  "email": "customer5@rkevent-test.com",
  "phone": "+91 99000 00005",
  "address": "Street Address 5, Landmark Road, India",
  "notes": "Test notes for customer number 5"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "name": "Customer Name 5",
    "companyName": "Customer Corp 5",
    "email": "customer5@rkevent-test.com",
    "phone": "+91 99000 00005",
    "address": "Street Address 5, Landmark Road, India",
    "notes": "Test notes for customer number 5",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638de85c08633858cad2f",
    "createdAt": "2026-07-02T10:09:34.498Z",
    "updatedAt": "2026-07-02T10:09:34.498Z",
    "__v": 0
  },
  "message": "Customer created successfully",
  "success": true
}
```

---

### Test Case 9: Create Invoice 1 (TINV-0081)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638dd85c08633858cad1b",
  "notes": "Due terms for event invoice 1.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 1",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0081",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638dd85c08633858cad1b",
    "items": [
      {
        "title": "Audio Event Rental Package 1",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638de85c08633858cad3a"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638de85c08633858cad3b"
      }
    ],
    "notes": "Due terms for event invoice 1.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638de85c08633858cad39",
    "invoiceDate": "2026-07-02T10:09:34.763Z",
    "createdAt": "2026-07-02T10:09:34.768Z",
    "updatedAt": "2026-07-02T10:09:34.768Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 10: Create Invoice 2 (TINV-0082)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad20",
  "notes": "Due terms for event invoice 2.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 2",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0082",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad20",
    "items": [
      {
        "title": "Audio Event Rental Package 2",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638df85c08633858cad46"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638df85c08633858cad47"
      }
    ],
    "notes": "Due terms for event invoice 2.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638df85c08633858cad45",
    "invoiceDate": "2026-07-02T10:09:35.024Z",
    "createdAt": "2026-07-02T10:09:35.027Z",
    "updatedAt": "2026-07-02T10:09:35.027Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 11: Create Invoice 3 (TINV-0083)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad25",
  "notes": "Due terms for event invoice 3.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 3",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0083",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad25",
    "items": [
      {
        "title": "Audio Event Rental Package 3",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638df85c08633858cad52"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638df85c08633858cad53"
      }
    ],
    "notes": "Due terms for event invoice 3.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638df85c08633858cad51",
    "invoiceDate": "2026-07-02T10:09:35.290Z",
    "createdAt": "2026-07-02T10:09:35.292Z",
    "updatedAt": "2026-07-02T10:09:35.292Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 12: Create Invoice 4 (TINV-0084)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad2a",
  "notes": "Due terms for event invoice 4.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 4",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0084",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad2a",
    "items": [
      {
        "title": "Audio Event Rental Package 4",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638df85c08633858cad5e"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638df85c08633858cad5f"
      }
    ],
    "notes": "Due terms for event invoice 4.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638df85c08633858cad5d",
    "invoiceDate": "2026-07-02T10:09:35.521Z",
    "createdAt": "2026-07-02T10:09:35.522Z",
    "updatedAt": "2026-07-02T10:09:35.522Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 13: Create Invoice 5 (TINV-0085)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad2f",
  "notes": "Due terms for event invoice 5.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 5",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0085",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad2f",
    "items": [
      {
        "title": "Audio Event Rental Package 5",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638df85c08633858cad6a"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638df85c08633858cad6b"
      }
    ],
    "notes": "Due terms for event invoice 5.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638df85c08633858cad69",
    "invoiceDate": "2026-07-02T10:09:35.754Z",
    "createdAt": "2026-07-02T10:09:35.756Z",
    "updatedAt": "2026-07-02T10:09:35.756Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 14: Create Invoice 6 (TINV-0086)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638dd85c08633858cad1b",
  "notes": "Due terms for event invoice 6.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 6",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0086",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638dd85c08633858cad1b",
    "items": [
      {
        "title": "Audio Event Rental Package 6",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638df85c08633858cad76"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638df85c08633858cad77"
      }
    ],
    "notes": "Due terms for event invoice 6.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638df85c08633858cad75",
    "invoiceDate": "2026-07-02T10:09:35.962Z",
    "createdAt": "2026-07-02T10:09:35.963Z",
    "updatedAt": "2026-07-02T10:09:35.963Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 15: Create Invoice 7 (TINV-0087)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad20",
  "notes": "Due terms for event invoice 7.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 7",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0087",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad20",
    "items": [
      {
        "title": "Audio Event Rental Package 7",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638e085c08633858cad82"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638e085c08633858cad83"
      }
    ],
    "notes": "Due terms for event invoice 7.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638e085c08633858cad81",
    "invoiceDate": "2026-07-02T10:09:36.205Z",
    "createdAt": "2026-07-02T10:09:36.206Z",
    "updatedAt": "2026-07-02T10:09:36.206Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 16: Create Invoice 8 (TINV-0088)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad25",
  "notes": "Due terms for event invoice 8.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 8",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0088",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad25",
    "items": [
      {
        "title": "Audio Event Rental Package 8",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638e085c08633858cad8e"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638e085c08633858cad8f"
      }
    ],
    "notes": "Due terms for event invoice 8.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638e085c08633858cad8d",
    "invoiceDate": "2026-07-02T10:09:36.454Z",
    "createdAt": "2026-07-02T10:09:36.457Z",
    "updatedAt": "2026-07-02T10:09:36.457Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 17: Create Invoice 9 (TINV-0089)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad2a",
  "notes": "Due terms for event invoice 9.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 9",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0089",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad2a",
    "items": [
      {
        "title": "Audio Event Rental Package 9",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638e085c08633858cad9a"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638e085c08633858cad9b"
      }
    ],
    "notes": "Due terms for event invoice 9.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638e085c08633858cad99",
    "invoiceDate": "2026-07-02T10:09:36.669Z",
    "createdAt": "2026-07-02T10:09:36.671Z",
    "updatedAt": "2026-07-02T10:09:36.671Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 18: Create Invoice 10 (TINV-0090)
- **Endpoint:** `POST /api/invoices`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "dueDate": "2026-09-15",
  "customer": "6a4638de85c08633858cad2f",
  "notes": "Due terms for event invoice 10.",
  "discount": 20,
  "items": [
    {
      "title": "Audio Event Rental Package 10",
      "description": "Set of wireless sound systems and arrays.",
      "quantity": 1,
      "price": 200
    },
    {
      "title": "Microphone set",
      "quantity": 2,
      "price": 25
    }
  ]
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "TINV-0090",
    "dueDate": "2026-09-15T00:00:00.000Z",
    "customer": "6a4638de85c08633858cad2f",
    "items": [
      {
        "title": "Audio Event Rental Package 10",
        "description": "Set of wireless sound systems and arrays.",
        "quantity": 1,
        "price": 200,
        "amount": 200,
        "_id": "6a4638e085c08633858cada6"
      },
      {
        "title": "Microphone set",
        "description": "",
        "quantity": 2,
        "price": 25,
        "amount": 50,
        "_id": "6a4638e085c08633858cada7"
      }
    ],
    "notes": "Due terms for event invoice 10.",
    "subtotal": 250,
    "discount": 20,
    "totalAmount": 230,
    "paidAmount": 0,
    "pendingAmount": 230,
    "status": "Pending",
    "isDeleted": false,
    "deletedAt": null,
    "_id": "6a4638e085c08633858cada5",
    "invoiceDate": "2026-07-02T10:09:36.903Z",
    "createdAt": "2026-07-02T10:09:36.919Z",
    "updatedAt": "2026-07-02T10:09:36.919Z",
    "__v": 0
  },
  "message": "Invoice created successfully",
  "success": true
}
```

---

### Test Case 19: Add Full Payment (Invoice 1)
- **Endpoint:** `POST /api/payments`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "invoiceId": "6a4638de85c08633858cad39",
  "amount": 230,
  "paymentMethod": "Credit Card",
  "transactionId": "TXN-FULL-001",
  "notes": "Cleared full invoice balance"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceId": "6a4638de85c08633858cad39",
    "amount": 230,
    "paymentMethod": "Credit Card",
    "transactionId": "TXN-FULL-001",
    "notes": "Cleared full invoice balance",
    "_id": "6a4638e185c08633858cadaf",
    "paymentDate": "2026-07-02T10:09:37.069Z",
    "createdAt": "2026-07-02T10:09:37.070Z",
    "updatedAt": "2026-07-02T10:09:37.070Z",
    "__v": 0
  },
  "message": "Payment added successfully",
  "success": true
}
```

---

### Test Case 20: Add Partial Payment (Invoice 2)
- **Endpoint:** `POST /api/payments`
- **Status:** 🟢 PASS

**Request Payload:**
```json
{
  "invoiceId": "6a4638df85c08633858cad45",
  "amount": 100,
  "paymentMethod": "UPI",
  "transactionId": "TXN-PART-002",
  "notes": "Partial advance booking fee"
}
```

**Response Body:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceId": "6a4638df85c08633858cad45",
    "amount": 100,
    "paymentMethod": "UPI",
    "transactionId": "TXN-PART-002",
    "notes": "Partial advance booking fee",
    "_id": "6a4638e185c08633858cadb8",
    "paymentDate": "2026-07-02T10:09:37.253Z",
    "createdAt": "2026-07-02T10:09:37.254Z",
    "updatedAt": "2026-07-02T10:09:37.254Z",
    "__v": 0
  },
  "message": "Payment added successfully",
  "success": true
}
```

---

### Test Case 21: Verify Invoice 1 Status and Values (Paid State)
- **Endpoint:** `GET /api/invoices/6a4638de85c08633858cad39`
- **Status:** 🟢 PASS

**Request Payload:**
```json
N/A
```

**Response Body:**
```json
{
  "invoiceNumber": "TINV-0081",
  "paidAmount": 230,
  "pendingAmount": 0,
  "status": "Paid"
}
```

---

### Test Case 22: Verify Invoice 2 Status and Values (Partial State)
- **Endpoint:** `GET /api/invoices/6a4638df85c08633858cad45`
- **Status:** 🟢 PASS

**Request Payload:**
```json
N/A
```

**Response Body:**
```json
{
  "invoiceNumber": "TINV-0082",
  "paidAmount": 100,
  "pendingAmount": 130,
  "status": "Partial"
}
```

---

### Test Case 23: Verify Dashboard Calculations
- **Endpoint:** `GET /api/dashboard`
- **Status:** 🟢 PASS

**Request Payload:**
```json
N/A
```

**Response Body:**
```json
{
  "customersCount": 45,
  "invoicesCount": 90,
  "totalRevenue": 20700,
  "totalPaid": 2970,
  "totalPending": 17730,
  "overdue": {
    "count": 0,
    "list": []
  },
  "monthlyRevenue": [
    {
      "revenue": 20700,
      "paid": 2970,
      "pending": 17730,
      "count": 90,
      "year": 2026,
      "month": 7
    }
  ],
  "recentInvoices": [
    {
      "_id": "6a4638e085c08633858cada5",
      "invoiceNumber": "TINV-0090",
      "dueDate": "2026-09-15T00:00:00.000Z",
      "customer": {
        "_id": "6a4638de85c08633858cad2f",
        "name": "Customer Name 5",
        "email": "customer5@rkevent-test.com"
      },
      "items": [
        {
          "title": "Audio Event Rental Package 10",
          "description": "Set of wireless sound systems and arrays.",
          "quantity": 1,
          "price": 200,
          "amount": 200,
          "_id": "6a4638e085c08633858cada6"
        },
        {
          "title": "Microphone set",
          "description": "",
          "quantity": 2,
          "price": 25,
          "amount": 50,
          "_id": "6a4638e085c08633858cada7"
        }
      ],
      "notes": "Due terms for event invoice 10.",
      "subtotal": 250,
      "discount": 20,
      "totalAmount": 230,
      "paidAmount": 0,
      "pendingAmount": 230,
      "status": "Pending",
      "isDeleted": false,
      "deletedAt": null,
      "invoiceDate": "2026-07-02T10:09:36.903Z",
      "createdAt": "2026-07-02T10:09:36.919Z",
      "updatedAt": "2026-07-02T10:09:36.919Z",
      "__v": 0
    },
    {
      "_id": "6a4638e085c08633858cad99",
      "invoiceNumber": "TINV-0089",
      "dueDate": "2026-09-15T00:00:00.000Z",
      "customer": {
        "_id": "6a4638de85c08633858cad2a",
        "name": "Customer Name 4",
        "email": "customer4@rkevent-test.com"
      },
      "items": [
        {
          "title": "Audio Event Rental Package 9",
          "description": "Set of wireless sound systems and arrays.",
          "quantity": 1,
          "price": 200,
          "amount": 200,
          "_id": "6a4638e085c08633858cad9a"
        },
        {
          "title": "Microphone set",
          "description": "",
          "quantity": 2,
          "price": 25,
          "amount": 50,
          "_id": "6a4638e085c08633858cad9b"
        }
      ],
      "notes": "Due terms for event invoice 9.",
      "subtotal": 250,
      "discount": 20,
      "totalAmount": 230,
      "paidAmount": 0,
      "pendingAmount": 230,
      "status": "Pending",
      "isDeleted": false,
      "deletedAt": null,
      "invoiceDate": "2026-07-02T10:09:36.669Z",
      "createdAt": "2026-07-02T10:09:36.671Z",
      "updatedAt": "2026-07-02T10:09:36.671Z",
      "__v": 0
    },
    {
      "_id": "6a4638e085c08633858cad8d",
      "invoiceNumber": "TINV-0088",
      "dueDate": "2026-09-15T00:00:00.000Z",
      "customer": {
        "_id": "6a4638de85c08633858cad25",
        "name": "Customer Name 3",
        "email": "customer3@rkevent-test.com"
      },
      "items": [
        {
          "title": "Audio Event Rental Package 8",
          "description": "Set of wireless sound systems and arrays.",
          "quantity": 1,
          "price": 200,
          "amount": 200,
          "_id": "6a4638e085c08633858cad8e"
        },
        {
          "title": "Microphone set",
          "description": "",
          "quantity": 2,
          "price": 25,
          "amount": 50,
          "_id": "6a4638e085c08633858cad8f"
        }
      ],
      "notes": "Due terms for event invoice 8.",
      "subtotal": 250,
      "discount": 20,
      "totalAmount": 230,
      "paidAmount": 0,
      "pendingAmount": 230,
      "status": "Pending",
      "isDeleted": false,
      "deletedAt": null,
      "invoiceDate": "2026-07-02T10:09:36.454Z",
      "createdAt": "2026-07-02T10:09:36.457Z",
      "updatedAt": "2026-07-02T10:09:36.457Z",
      "__v": 0
    },
    {
      "_id": "6a4638e085c08633858cad81",
      "invoiceNumber": "TINV-0087",
      "dueDate": "2026-09-15T00:00:00.000Z",
      "customer": {
        "_id": "6a4638de85c08633858cad20",
        "name": "Customer Name 2",
        "email": "customer2@rkevent-test.com"
      },
      "items": [
        {
          "title": "Audio Event Rental Package 7",
          "description": "Set of wireless sound systems and arrays.",
          "quantity": 1,
          "price": 200,
          "amount": 200,
          "_id": "6a4638e085c08633858cad82"
        },
        {
          "title": "Microphone set",
          "description": "",
          "quantity": 2,
          "price": 25,
          "amount": 50,
          "_id": "6a4638e085c08633858cad83"
        }
      ],
      "notes": "Due terms for event invoice 7.",
      "subtotal": 250,
      "discount": 20,
      "totalAmount": 230,
      "paidAmount": 0,
      "pendingAmount": 230,
      "status": "Pending",
      "isDeleted": false,
      "deletedAt": null,
      "invoiceDate": "2026-07-02T10:09:36.205Z",
      "createdAt": "2026-07-02T10:09:36.206Z",
      "updatedAt": "2026-07-02T10:09:36.206Z",
      "__v": 0
    },
    {
      "_id": "6a4638df85c08633858cad75",
      "invoiceNumber": "TINV-0086",
      "dueDate": "2026-09-15T00:00:00.000Z",
      "customer": {
        "_id": "6a4638dd85c08633858cad1b",
        "name": "Customer Name 1",
        "email": "customer1@rkevent-test.com"
      },
      "items": [
        {
          "title": "Audio Event Rental Package 6",
          "description": "Set of wireless sound systems and arrays.",
          "quantity": 1,
          "price": 200,
          "amount": 200,
          "_id": "6a4638df85c08633858cad76"
        },
        {
          "title": "Microphone set",
          "description": "",
          "quantity": 2,
          "price": 25,
          "amount": 50,
          "_id": "6a4638df85c08633858cad77"
        }
      ],
      "notes": "Due terms for event invoice 6.",
      "subtotal": 250,
      "discount": 20,
      "totalAmount": 230,
      "paidAmount": 0,
      "pendingAmount": 230,
      "status": "Pending",
      "isDeleted": false,
      "deletedAt": null,
      "invoiceDate": "2026-07-02T10:09:35.962Z",
      "createdAt": "2026-07-02T10:09:35.963Z",
      "updatedAt": "2026-07-02T10:09:35.963Z",
      "__v": 0
    }
  ]
}
```

---

### Test Case 24: Verify PDF Generation
- **Endpoint:** `GET /api/invoices/6a4638de85c08633858cad39/pdf`
- **Status:** 🟢 PASS

**Request Payload:**
```json
N/A
```

**Response Body:**
```json
{
  "contentType": "application/pdf",
  "size": 72425
}
```

---

### Test Case 25: Verify Email Invoice Transmission
- **Endpoint:** `POST /api/invoices/6a4638de85c08633858cad39/email`
- **Status:** 🟢 PASS

**Request Payload:**
```json
N/A
```

**Response Body:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Invoice emailed successfully",
  "success": true
}
```

---

### Test Case 26: Verify WhatsApp Link Generation
- **Endpoint:** `GET /api/invoices/6a4638de85c08633858cad39/share-whatsapp`
- **Status:** 🟢 PASS

**Request Payload:**
```json
N/A
```

**Response Body:**
```json
{
  "whatsappLink": "https://wa.me/919900000001?text=Hello%20Customer%20Name%201%2C%0A%0AThis%20is%20a%20message%20from%20*RK%20Event%20Integration%20Corp*%20regarding%20your%20invoice%20*TINV-0081*.%0A%0A*Invoice%20Details%3A*%0A-%20Issue%20Date%3A%202%2F7%2F2026%0A-%20Due%20Date%3A%2015%2F9%2F2026%0A-%20Total%20Amount%3A%20%24230.00%0A-%20Paid%20Amount%3A%20%24230.00%0A-%20Balance%20Due%3A%20*%240.00*%0A-%20Payment%20Status%3A%20*PAID*%0A%0APlease%20clear%20the%20balance%20as%20soon%20as%20possible.%20Thank%20you%20for%20your%20business!",
  "messageText": "Hello Customer Name 1,\n\nThis is a message from *RK Event Integration Corp* regarding your invoice *TINV-0081*.\n\n*Invoice Details:*\n- Issue Date: 2/7/2026\n- Due Date: 15/9/2026\n- Total Amount: $230.00\n- Paid Amount: $230.00\n- Balance Due: *$0.00*\n- Payment Status: *PAID*\n\nPlease clear the balance as soon as possible. Thank you for your business!"
}
```

---
