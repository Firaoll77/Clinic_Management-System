# Clinic Management System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Service Layer](#service-layer)
10. [Security](#security)
11. [Development Guide](#development-guide)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Demo Walkthrough](#demo-walkthrough)

---

## System Overview

The Clinic Management System is a comprehensive, paperless healthcare management platform designed to streamline clinic operations, patient care, appointments, billing, and laboratory services. The system provides role-based access control, ensuring that each staff member has appropriate access to the features they need.

### Key Features
- **Patient Management**: Complete patient lifecycle management with MRN generation
- **Clinical Module (EMR)**: Electronic medical records with SOAP notes
- **Prescription System**: Medication management with allergy checks
- **Laboratory System**: Lab orders and results management with auto-integration
- **Billing & Payments**: Automated invoicing, payment processing, and discharge workflow
- **Patient Discharge**: Automated discharge after payment with encounter completion
- **Lab Integration**: Auto-fee addition, auto-status transitions, enhanced lab dashboard
- **Role-Based Access**: Granular permissions for different user types

---

## Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                  http://localhost:3000                      │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │  Patient    │ Appointment │   Clinical  │   Billing   │ │
│  │ Management │   System    │   Module    │   Module    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                 Backend API (Express.js)                     │
│                  http://localhost:4000/api                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Auth      │  Patients   │ Appointments │  Encounters │ │
│  │ Middleware  │  Routes     │   Routes     │   Routes    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Prescr.   │ Laboratory │  Billing    │   Reports   │ │
│  │   Routes    │   Routes    │   Routes    │   Routes    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Service Layer                              │ │
│  │  PatientService | AppointmentService | EncounterService│ │
│  │  PrescriptionService | LabService | BillingService   │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ Prisma ORM
                            │
┌───────────────────────────┴─────────────────────────────────┐
│              PostgreSQL Database (Docker)                   │
│                   localhost:5432/clinic_db                  │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Users     │  Patients   │ Appointments │  Encounters │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ Prescr.     │ Lab Orders  │  Invoices   │  Payments   │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Frontend (Next.js)
- **User Interface**: React-based user interface with TypeScript
- **State Management**: React Context for global state
- **Routing**: Next.js App Router for navigation
- **API Communication**: Axios for HTTP requests
- **Authentication**: JWT token management
- **UI Components**: Tailwind CSS for styling

#### Backend (Express.js)
- **API Routes**: RESTful API endpoints
- **Authentication**: JWT-based authentication middleware
- **Request Validation**: Zod schema validation
- **Error Handling**: Centralized error handling
- **Logging**: Pino logger for structured logging

#### Service Layer
- **Business Logic**: Core business logic implementation
- **Data Validation**: Service-level validation
- **Database Operations**: Prisma ORM operations
- **Workflow Automation**: Automated workflows and triggers

#### Database (PostgreSQL)
- **Data Storage**: Relational data storage
- **Data Integrity**: Foreign key constraints
- **Data Relationships**: Complex relationships between entities
- **Indexing**: Optimized queries with proper indexing

---

## Technology Stack

### Frontend Technologies
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **React Context**: State management
- **Axios**: HTTP client library

### Backend Technologies
- **Node.js 18+**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Type-safe development
- **Prisma ORM**: Database ORM
- **PostgreSQL**: Relational database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Zod**: Schema validation
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Pino**: Structured logging

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **PostgreSQL 16**: Database server
- **Git**: Version control

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- PostgreSQL client (optional)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Clinic-Management-System
```

### Step 2: Environment Configuration

#### Backend Environment (.env)
Create `.env` file in `backend/` directory:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clinic_db

# JWT Authentication
JWT_SECRET=clinic-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=clinic-super-secret-refresh-key-change-in-production-2024
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application
NODE_ENV=development
API_PORT=4000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Email/SMS (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (.env.local)
Create `.env.local` file in `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Step 3: Start Database with Docker
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database on port 5432
- Backend API on port 4000 (if using Docker)

### Step 4: Database Setup
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed
```

### Step 5: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd frontend
npm install
```

### Step 6: Start Development Servers

#### Start Backend (if not using Docker)
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:4000

#### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

### Step 7: Verify Installation
1. Open http://localhost:3000 in browser
2. Login with credentials provided below
3. Verify dashboard loads correctly

---

## Database Schema

### Core Entities

#### User
```typescript
{
  id: string (UUID)
  email: string (unique)
  passwordHash: string
  role: Role (ADMIN, RECEPTIONIST, DOCTOR, NURSE, LAB_TECH)
  isActive: boolean
  lastLoginAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
  staffProfile: StaffProfile?
}
```

#### StaffProfile
```typescript
{
  id: string (UUID)
  userId: string (unique)
  fullName: string
  specialization: string?
  licenseNo: string?
  departmentId: string?
  phone: string?
  createdAt: DateTime
  updatedAt: DateTime
  user: User
  doctorAvailability: DoctorAvailability[]
}
```

#### Patient
```typescript
{
  id: string (UUID)
  mrn: string (unique) // Medical Record Number
  firstName: string
  lastName: string
  dob: DateTime
  gender: string
  phone: string
  email: string?
  nationalId: string? (unique)
  address: string?
  bloodGroup: string?
  emergencyContact: string?
  isArchived: boolean
  archivedAt: DateTime?
  lastActivityAt: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  appointments: Appointment[]
  encounters: Encounter[]
  invoices: Invoice[]
  allergies: PatientAllergy[]
  emergencyAccess: EmergencyAccess[]
}
```

#### Appointment
```typescript
{
  id: string (UUID)
  patientId: string
  doctorId: string
  scheduledAt: DateTime
  durationMin: number
  status: AppointmentStatus (SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
  reason: string?
  createdBy: string?
  cancelledReason: string?
  createdAt: DateTime
  updatedAt: DateTime
  patient: Patient
  encounter: Encounter?
}
```

#### Encounter
```typescript
{
  id: string (UUID)
  appointmentId: string (unique)
  patientId: string
  nurseId: string?
  doctorId: string?
  chiefComplaint: string?
  subjective: string?
  objective: string?
  assessment: string?
  plan: string?
  icd10Code: string?
  visitStatus: VisitStatus (TRIAGE, DOCTOR_CONSULT, LAB_PENDING, LAB_READY, BILLING, COMPLETED)
  signedAt: DateTime?
  signedBy: string?
  dischargeNotes: string?
  createdAt: DateTime
  updatedAt: DateTime
  appointment: Appointment
  patient: Patient
  vitals: Vital[]
  prescriptions: Prescription[]
  labOrders: LabOrder[]
  attachments: Attachment[]
  invoices: Invoice[]
  encounterFees: EncounterFee[]
}
```

#### Vital
```typescript
{
  id: string (UUID)
  encounterId: string
  temperatureC: float?
  systolic: int?
  diastolic: int?
  pulse: int?
  respRate: int?
  spo2: int?
  weightKg: float?
  heightCm: float?
  bmi: float?
  recordedBy: string
  recordedAt: DateTime
  encounter: Encounter
}
```

#### Prescription
```typescript
{
  id: string (UUID)
  encounterId: string
  patientId: string
  doctorId: string
  status: PrescriptionStatus (PENDING, PARTIALLY_DISPENSED, DISPENSED, CANCELLED)
  issuedAt: DateTime
  notes: string?
  createdAt: DateTime
  updatedAt: DateTime
  encounter: Encounter
  items: PrescriptionItem[]
}
```

#### PrescriptionItem
```typescript
{
  id: string (UUID)
  prescriptionId: string
  inventoryItemId: string?
  drugName: string
  dosage: string
  frequency: string
  durationDays: int
  route: string?
  instructions: string?
  quantity: int
  createdAt: DateTime
  updatedAt: DateTime
  prescription: Prescription
  inventoryItem: InventoryItem?
  dispenseRecords: DispenseRecord[]
}
```

#### LabOrder
```typescript
{
  id: string (UUID)
  encounterId: string
  patientId: string
  orderedBy: string
  status: LabStatus (ORDERED, IN_PROGRESS, COMPLETED, CANCELLED)
  priority: string (ROUTINE, URGENT, STAT)
  notes: string?
  orderedAt: DateTime
  completedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
  encounter: Encounter
  results: LabResult[]
  labAssignments: LabAssignment[]
}
```

#### LabResult
```typescript
{
  id: string (UUID)
  labOrderId: string
  labTestId: string
  value: string
  unit: string?
  referenceRange: string?
  flag: string? (H/L/N)
  enteredBy: string
  enteredAt: DateTime
  labOrder: LabOrder
  labTest: LabTest
}
```

#### Invoice
```typescript
{
  id: string (UUID)
  invoiceNo: string (unique)
  patientId: string
  encounterId: string?
  status: InvoiceStatus (DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID, REFUNDED)
  subtotal: Decimal
  discountAmount: Decimal?
  discountReason: string?
  taxAmount: Decimal?
  total: Decimal
  balance: Decimal
  issuedAt: DateTime?
  createdBy: string?
  createdAt: DateTime
  updatedAt: DateTime
  patient: Patient
  encounter: Encounter?
  items: InvoiceItem[]
  payments: Payment[]
}
```

#### Payment
```typescript
{
  id: string (UUID)
  invoiceId: string
  amount: Decimal
  method: PaymentMethod (CASH, CARD, MOBILE_MONEY, BANK_TRANSFER)
  reference: string?
  receivedBy: string
  receivedAt: DateTime
  invoice: Invoice
}
```

### Database Relationships
- **User** ↔ **StaffProfile** (1:1)
- **StaffProfile** ↔ **DoctorAvailability** (1:N)
- **Patient** ↔ **Appointment** (1:N)
- **Patient** ↔ **Encounter** (1:N)
- **Patient** ↔ **Invoice** (1:N)
- **Patient** ↔ **PatientAllergy** (1:N)
- **Appointment** ↔ **Encounter** (1:1)
- **Encounter** ↔ **Vital** (1:N)
- **Encounter** ↔ **Prescription** (1:N)
- **Encounter** ↔ **LabOrder** (1:N)
- **Encounter** ↔ **Attachment** (1:N)
- **Prescription** ↔ **PrescriptionItem** (1:N)
- **LabOrder** ↔ **LabResult** (1:N)
- **Invoice** ↔ **InvoiceItem** (1:N)
- **Invoice** ↔ **Payment** (1:N)

---

## API Documentation

### Base URL
- **Development**: `http://localhost:4000/api`
- **Production**: `https://your-domain.com/api`

### Authentication
All API endpoints (except `/api/auth/login`) require JWT authentication:

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Core API Endpoints

#### Authentication Endpoints

##### POST /api/auth/login
Login to get JWT token

**Request:**
```json
{
  "email": "doctor@clinic.com",
  "password": "Doctor@123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "doctor@clinic.com",
    "role": "DOCTOR",
    "staffProfile": {...}
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

##### POST /api/auth/refresh
Refresh access token

**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

##### GET /api/auth/me
Get current user info

##### POST /api/auth/logout
Logout user

#### Patient Endpoints

##### POST /api/patients/register
Register new patient with MRN generation

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1990-01-01",
  "gender": "MALE",
  "phone": "+1234567890",
  "email": "john.doe@example.com",
  "nationalId": "1234567890123",
  "address": "123 Main St",
  "bloodGroup": "O+",
  "emergencyContact": "+1234567890",
  "allergies": [
    {
      "substance": "Penicillin",
      "severity": "SEVERE",
      "notes": "Anaphylactic reaction"
    }
  ]
}
```

##### GET /api/patients/search?q=query
Search patients by name, phone, MRN, email, or national ID

##### GET /api/patients/mrn/:mrn
Get patient by MRN

##### GET /api/patients/:mrn/timeline
Get patient timeline

##### PATCH /api/patients/mrn/:mrn
Update patient information

##### DELETE /api/patients/mrn/:mrn
Archive patient (soft delete)

#### Appointment Endpoints

##### GET /api/appointments/available-slots/:doctorId?date=YYYY-MM-DD
Get available time slots

##### POST /api/appointments
Create appointment

**Request:**
```json
{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "scheduledAt": "2024-08-20T10:00:00Z",
  "durationMin": 30,
  "reason": "Annual checkup"
}
```

##### PATCH /api/appointments/:id/status
Update appointment status

##### PATCH /api/appointments/:id/reschedule
Reschedule appointment

##### POST /api/appointments/:id/cancel
Cancel appointment

#### Encounter Endpoints

##### POST /api/encounters
Create encounter

##### POST /api/encounters/:id/vitals
Record patient vitals

##### POST /api/encounters/:id/soap
Add SOAP note

##### POST /api/encounters/:id/diagnosis
Add diagnosis

##### POST /api/encounters/:id/signoff
Sign off encounter

##### PATCH /api/encounters/:id/discharge
Discharge patient (complete encounter) - Receptionist, Doctor, Admin

#### Prescription Endpoints

##### POST /api/prescriptions
Create prescription

##### POST /api/prescriptions/:id/medications
Add medication with allergy check

##### POST /api/prescriptions/check-allergies
Check for drug allergies

##### POST /api/prescriptions/check-interactions
Check for drug interactions

#### Laboratory Endpoints

##### POST /api/lab/orders
Create lab order (auto-adds lab fees to encounter, auto-transitions to LAB_PENDING)

##### POST /api/lab/orders/:id/results
Enter lab results (auto-transitions to LAB_READY)

##### POST /api/lab/orders/:id/complete
Mark lab order as completed (auto-transitions to BILLING)

##### GET /api/lab/orders/pending
Get pending lab orders

##### GET /api/lab/tests
Get lab test catalogue

##### POST /api/lab/tests
Create lab test (Admin only)

##### PATCH /api/lab/tests/:id
Update lab test (Admin only)

##### DELETE /api/lab/tests/:id
Delete lab test (Admin only)

#### Billing Endpoints

##### POST /api/billing/invoices
Create invoice from encounter fees (Receptionist only)

##### GET /api/billing/invoices
Get all invoices (Receptionist only)

##### GET /api/billing/invoices/:id
Get invoice details

##### PATCH /api/billing/invoices/:id/mark-paid
Mark invoice as paid (Receptionist only)

##### GET /api/billing/patient/:patientId/invoices
Get all invoices for a patient (Receptionist, Admin)

##### GET /api/billing/fee-configurations
Get fee configurations (Admin only)

##### POST /api/billing/fee-configurations
Create/update fee configuration (Admin only)

##### POST /api/billing/invoices/:id/payments
Process payment

##### POST /api/billing/invoices/:id/discount
Apply discount

#### Report Endpoints

##### GET /api/reports/revenue/daily/:date
Daily revenue report

##### GET /api/reports/revenue/monthly/:year/:month
Monthly revenue report

##### GET /api/reports/operational?startDate=&endDate=
Operational statistics

##### GET /api/reports/financial?startDate=&endDate=
Financial summary

##### POST /api/reports/export/csv
Export data to CSV

---

## Frontend Components

### Page Structure

#### Authentication Pages
- `/login` - Login page
- `/register` - Registration (admin only)

#### Dashboard Pages
- `/dashboard` - Main dashboard (role-based)
- `/dashboard/admin` - Admin dashboard
- `/dashboard/doctor` - Doctor dashboard
- `/dashboard/nurse` - Nurse dashboard
- `/dashboard/lab` - Lab technician dashboard
- `/dashboard/accountant` - Accountant dashboard

#### Patient Management
- `/patients` - Patient list
- `/patients/register` - Register new patient
- `/patients/mrn/:mrn` - Patient profile
- `/patients/mrn/:mrn/edit` - Edit patient

#### Appointments
- `/appointments` - Appointment list
- `/appointments/calendar` - Calendar view
- `/appointments/new` - Book appointment
- `/appointments/:id` - Appointment details

#### Clinical Module
- `/encounters/:id` - Encounter details
- `/encounters/:id/vitals` - Vitals recording
- `/encounters/:id/soap` - SOAP notes
- `/encounters/:id/prescriptions` - Prescriptions

#### Laboratory
- `/lab/orders` - Lab orders
- `/lab/orders/:id` - Lab order details
- `/lab/catalogue` - Lab test catalogue

#### Billing
- `/billing/invoices` - Invoice list
- `/billing/invoices/:id` - Invoice details
- `/billing/payments` - Payment processing

### Key Components

#### AuthenticationProvider
- Manages authentication state
- Handles JWT token storage
- Provides auth context to app

#### Layout Components
- `DashboardLayout` - Main dashboard layout
- `AuthLayout` - Authentication pages layout
- `ProtectedRoute` - Route protection wrapper

#### Patient Components
- `PatientCard` - Patient display card
- `PatientForm` - Patient registration/edit form
- `PatientSearch` - Patient search component
- `PatientTimeline` - Patient activity timeline

#### Appointment Components
- `CalendarView` - Calendar view component
- `AppointmentCard` - Appointment display card
- `BookingForm` - Appointment booking form
- `AvailableSlots` - Available time slots display

#### Clinical Components
- `VitalsForm` - Vitals recording form
- `SOAPForm` - SOAP notes form
- `PrescriptionForm` - Prescription form
- `EncounterView` - Encounter details view

#### Lab Components
- `LabOrderCard` - Lab order display
- `ResultsEntryForm` - Lab results entry form
- `LabTestCatalogue` - Lab test catalogue

#### Billing Components
- `InvoiceCard` - Invoice display
- `PaymentForm` - Payment processing form
- `FinancialSummary` - Financial summary widget

---

## User Roles & Permissions

### Role Matrix

| Feature | Admin | Doctor | Nurse | Receptionist | Lab Tech |
|---------|-------|--------|-------|--------------|----------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Patient Registration | ✅ | ✅ | ✅ | ✅ | ❌ |
| Patient Editing | ✅ | ✅ | ✅ | ✅ | ❌ |
| Patient Archiving | ✅ | ❌ | ❌ | ❌ | ❌ |
| Appointment Booking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Appointment Management | ✅ | ✅ | ✅ | ✅ | ❌ |
| Vitals Recording | ✅ | ✅ | ✅ | ❌ | ❌ |
| SOAP Notes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Prescriptions | ✅ | ✅ | ❌ | ✅ | ❌ |
| Lab Orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lab Results Entry | ✅ | ❌ | ❌ | ❌ | ✅ |
| Lab Test Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invoice Generation | ✅ | ❌ | ❌ | ✅ | ❌ |
| Payment Processing | ✅ | ❌ | ❌ | ✅ | ❌ |
| Patient Discharge | ✅ | ✅ | ❌ | ✅ | ❌ |
| Fee Configuration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports Access | ✅ | ❌ | ❌ | ✅ | ❌ |
| System Configuration | ✅ | ❌ | ❌ | ❌ | ❌ |

### Login Credentials

#### System Administrator
- **Email**: `admin@clinic.com`
- **Password**: `Admin@123`
- **Access**: Full system access, user management, reports

#### Doctor
- **Email**: `doctor@clinic.com`
- **Password**: `Doctor@123`
- **Access**: Patient care, prescriptions, lab orders, encounters

#### Receptionist
- **Email**: `reception@clinic.com`
- **Password**: `Reception@123`
- **Access**: Patient registration, appointment scheduling, check-in/out

#### Nurse
- **Email**: `nurse@clinic.com`
- **Password**: `Nurse@123`
- **Access**: Vitals recording, patient assistance, basic encounter management

#### Lab Technician
- **Email**: `lab@clinic.com`
- **Password**: `Lab@123`
- **Access**: Lab results entry, lab order management

---

## Service Layer

### PatientService
Handles patient management operations including registration, search, and updates.

**Key Methods:**
- `registerPatient()` - Register new patient with MRN generation
- `searchPatients()` - Search patients by multiple criteria
- `getPatientByMRN()` - Get patient by Medical Record Number
- `updatePatient()` - Update patient information
- `archivePatient()` - Archive patient (soft delete)
- `checkDuplicates()` - Check for duplicate patients
- `getPatientTimeline()` - Get unified patient timeline

### AppointmentService
Manages appointment scheduling and workflow.

**Key Methods:**
- `createAppointment()` - Create new appointment
- `getAvailableSlots()` - Get available time slots
- `checkAvailability()` - Check doctor availability
- `getAppointments()` - Get appointments with filters
- `updateAppointment()` - Update appointment details

### AppointmentWorkflowService
Handles appointment status transitions and workflow automation.

**Key Methods:**
- `transitionStatus()` - Transition appointment status with validation
- `rescheduleAppointment()` - Reschedule with conflict checking
- `cancelAppointment()` - Cancel with reason tracking
- `getAppointmentHistory()` - Get appointment history
- `createReminder()` - Create appointment reminders
- `getUpcomingAppointments()` - Get upcoming appointments

### EncounterService
Manages patient encounters and clinical documentation.

**Key Methods:**
- `createEncounter()` - Create new encounter
- `recordVitals()` - Record patient vitals
- `addSOAPNote()` - Add SOAP documentation
- `addDiagnosis()` - Add ICD-10 diagnosis
- `updateVisitStatus()` - Update visit status
- `getEncounter()` - Get encounter with details
- `signOffEncounter()` - Sign off encounter
- `getActiveEncounters()` - Get active encounters

### PrescriptionService
Handles prescription management and medication safety.

**Key Methods:**
- `createPrescription()` - Create new prescription
- `addMedication()` - Add medication with allergy check
- `checkAllergies()` - Check for drug allergies
- `checkDrugInteractions()` - Check for drug interactions
- `getPrescription()` - Get prescription details
- `dispensePrescription()` - Dispense prescription
- `getPatientPrescriptions()` - Get patient prescription history

### LabService
Manages laboratory orders and results with auto-integration.

**Key Methods:**
- `createLabOrder()` - Create lab order (auto-adds fees, auto-transitions to LAB_PENDING)
- `enterLabResult()` - Enter lab results (auto-transitions to LAB_READY)
- `completeLabOrder()` - Complete lab order (auto-transitions to BILLING)
- `getLabOrder()` - Get lab order with results
- `getPendingLabOrders()` - Get pending lab orders
- `getLabTests()` - Get lab test catalogue
- `getPatientLabHistory()` - Get patient lab history

### BillingService
Handles billing and payment processing with discharge integration.

**Key Methods:**
- `createInvoice()` - Create new invoice from encounter fees
- `calculateInvoiceSubtotal()` - Calculate invoice subtotal
- `calculateGrandTotal()` - Calculate total with discounts
- `processPayment()` - Process payment
- `markInvoiceAsPaid()` - Mark invoice as paid (triggers auto-discharge)
- `applyDiscount()` - Apply discount to invoice
- `getInvoiceForCheckout()` - Get invoice for checkout
- `voidInvoice()` - Void invoice
- `getFeeConfigurations()` - Get fee configurations
- `updateFeeConfiguration()` - Update fee configuration

### AccountantService
Extended billing and financial operations.

**Key Methods:**
- `processPayment()` - Process payment with visit completion
- `issueInvoice()` - Issue invoice
- `applyDiscount()` - Apply discount
- `getInvoiceForCheckout()` - Get invoice with calculations
- `voidInvoice()` - Void invoice

### ReportService
Generates operational and financial reports.

**Key Methods:**
- `getDailyRevenueReport()` - Daily revenue report
- `getMonthlyRevenueReport()` - Monthly revenue report
- `getOperationalStats()` - Operational statistics
- `getDoctorPerformanceReport()` - Doctor performance metrics
- `getFinancialSummary()` - Financial summary
- `exportToCSV()` - Export data to CSV
- `getPatientVisitHistory()` - Patient visit history export

### VisitRoutingService
Manages patient routing through clinic stages with auto-transitions.

**Key Methods:**
- `getDoctorConsultationPatients()` - Get patients in doctor consultation
- `getLabPendingPatients()` - Get patients with pending lab orders
- `completeLabOrder()` - Complete lab order and auto-transition to BILLING
- `getTriagePatients()` - Get patients in triage
- `completeTriage()` - Complete triage and route to doctor
- `getBillingPatients()` - Get patients in billing
- `completeConsultation()` - Complete consultation and route to billing
- `completeVisit()` - Complete visit after payment
- `dischargePatient()` - Discharge patient and mark encounter as COMPLETED

---

## Security

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials and generates JWT tokens
3. Client stores tokens (access token in memory, refresh token in localStorage)
4. Client includes access token in Authorization header
5. Server validates token and processes request
6. When access token expires, client uses refresh token to get new access token

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Role-Based Access Control**: Granular permissions per role
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Prisma ORM prevents SQL injection
- **XSS Protection**: Input sanitization and CSP headers
- **CORS Configuration**: Controlled cross-origin access
- **Security Headers**: Helmet.js for security headers
- **Audit Logging**: Comprehensive audit trail for sensitive operations
- **Rate Limiting**: API rate limiting to prevent abuse

### Security Headers
```javascript
Helmet middleware sets:
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: default-src 'self'
```

### Data Encryption
- **Passwords**: bcrypt hashing (12 rounds)
- **JWT Tokens**: Signed with secret key
- **Database**: PostgreSQL with SSL (configurable)
- **API**: HTTPS in production (recommended)

---

## Development Guide

### Code Structure

#### Backend Structure
```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── lib/                  # Service layer
│   │   ├── prisma.ts        # Prisma client
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── validation.ts    # Zod schemas
│   │   ├── patientService.ts
│   │   ├── appointmentService.ts
│   │   ├── encounterService.ts
│   │   ├── prescriptionService.ts
│   │   ├── labService.ts
│   │   ├── billingService.ts
│   │   ├── reportService.ts
│   │   └── ...
│   ├── routes/               # API routes
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── appointments.ts
│   │   ├── medical.ts
│   │   ├── lab.ts
│   │   ├── billing.ts
│   │   ├── reports.ts
│   │   └── dashboard.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Database seeding
├── package.json
└── tsconfig.json
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── login/            # Login page
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── patients/         # Patient pages
│   │   ├── appointments/     # Appointment pages
│   │   ├── encounters/      # Encounter pages
│   │   ├── lab/              # Lab pages
│   │   └── billing/          # Billing pages
│   ├── components/          # React components
│   │   ├── ui/              # UI components
│   │   ├── patients/         # Patient components
│   │   ├── appointments/     # Appointment components
│   │   ├── medical/         # Medical components
│   │   └── lab/             # Lab components
│   ├── lib/                 # Utilities
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth utilities
│   │   └── utils.ts         # General utilities
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   └── types/               # TypeScript types
├── package.json
├── next.config.js
└── tailwind.config.js
```

### Development Workflow

#### Adding New API Endpoint
1. Create service method in appropriate service file
2. Add validation schema in `validation.ts`
3. Create route handler in appropriate routes file
4. Add authentication middleware if needed
5. Test endpoint with API client (Postman/Thunder Client)

#### Adding New Frontend Page
1. Create page in appropriate `app/` directory
2. Create necessary components in `components/`
3. Add API calls using `lib/api.ts`
4. Implement authentication check if needed
5. Test user flow end-to-end

#### Database Schema Changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name`
3. Update TypeScript types if needed
4. Update service layer to use new fields
5. Test database operations

### Testing

#### Backend Testing
```bash
cd backend
npm test              # Run all tests
npm test --watch      # Watch mode
npm test --coverage   # With coverage
```

#### Frontend Testing
```bash
cd frontend
npm test              # Run all tests
npm test --watch      # Watch mode
npm test --coverage   # With coverage
```

### Code Quality

#### Linting
```bash
# Backend
cd backend
npm run lint
npm run lint:fix

# Frontend
cd frontend
npm run lint
npm run lint:fix
```

#### Type Checking
```bash
# Backend
cd backend
npx tsc --noEmit

# Frontend
cd frontend
npx tsc --noEmit
```

---

## Deployment

### Production Deployment Steps

#### 1. Environment Setup
Set production environment variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@production-host:5432/clinic_db
JWT_SECRET=strong-production-secret
JWT_REFRESH_SECRET=strong-production-refresh-secret
```

#### 2. Database Setup
```bash
# Run migrations in production
npx prisma migrate deploy

# Seed production data (optional)
npx prisma db seed
```

#### 3. Build Applications
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

#### 4. Docker Deployment
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

#### 5. SSL/TLS Configuration
Configure SSL certificates for HTTPS:
- Use Let's Encrypt for free SSL
- Configure nginx reverse proxy
- Update CORS origins

#### 6. Monitoring Setup
- Set up application monitoring (e.g., New Relic, DataDog)
- Configure error tracking (e.g., Sentry)
- Set up log aggregation (e.g., ELK stack)

#### 7. Backup Strategy
- Configure automated database backups
- Set up file backup for uploads
- Document recovery procedures

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Logging configured
- [ ] Health checks implemented

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
**Problem**: "Can't reach database server"
**Solution**:
1. Check Docker containers are running: `docker-compose ps`
2. Verify DATABASE_URL in .env file
3. Check PostgreSQL is accessible: `docker-compose exec db pg_isready`
4. Restart containers: `docker-compose restart`

#### Authentication Issues
**Problem**: "Invalid credentials" or "Token expired"
**Solution**:
1. Verify user credentials are correct
2. Check JWT_SECRET is consistent across restarts
3. Clear browser localStorage and try again
4. Check user isActive flag in database

#### Frontend Build Issues
**Problem**: Build fails with TypeScript errors
**Solution**:
1. Run `npm run lint` to identify issues
2. Check TypeScript types are correct
3. Verify all dependencies are installed
4. Clear Next.js cache: `rm -rf .next`

#### API Connection Issues
**Problem**: "Network Error" or CORS errors
**Solution**:
1. Verify backend is running on correct port
2. Check CORS_ORIGIN in backend .env
3. Verify NEXT_PUBLIC_API_URL in frontend .env.local
4. Check firewall settings

#### Migration Issues
**Problem**: Migration fails or schema conflicts
**Solution**:
1. Check current migration status: `npx prisma migrate status`
2. Resolve conflicts manually if needed
3. Reset database (caution: data loss): `npx prisma migrate reset`
4. Create new migration: `npx prisma migrate dev --name fix`

### Debugging Tips

#### Enable Debug Logging
```bash
# Backend debug mode
DEBUG=* npm run dev

# Prisma debug
DEBUG=prisma:* npm run dev
```

#### Database Inspection
```bash
# Open Prisma Studio
npx prisma studio

# Direct database access
docker-compose exec db psql -U postgres -d clinic_db
```

#### API Testing
```bash
# Use curl to test endpoints
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@clinic.com","password":"Doctor@123"}'
```

---

## Demo Walkthrough

### 1. Patient Registration Workflow

**Step 1**: Login as Receptionist
- Navigate to http://localhost:3000
- Login with `reception@clinic.com` / `Reception@123`

**Step 2**: Register New Patient
- Click "Register Patient" in dashboard
- Fill in patient information:
  - First Name: John
  - Last Name: Doe
  - Date of Birth: 1990-01-01
  - Gender: Male
  - Phone: +1234567890
  - Email: john.doe@example.com
  - Address: 123 Main St
  - Blood Group: O+
  - Emergency Contact: +1234567890 (Jane Doe)
- Add allergies if applicable
- Click "Register Patient"

**Step 3**: Verify Registration
- System generates MRN (e.g., MRN-2024-12345678)
- Duplicate check runs automatically
- Patient appears in patient list
- Timeline shows registration event

### 2. Appointment Scheduling Workflow

**Step 1**: Select Doctor
- Navigate to Appointments page
- Click "Book Appointment"
- Select doctor from dropdown

**Step 2**: View Availability
- Calendar shows available slots
- Green slots = available
- Red slots = booked
- Click on desired date

**Step 3**: Book Appointment
- Select time slot
- Enter patient MRN or search patient
- Enter reason for visit
- Click "Book Appointment"

**Step 4**: Confirmation
- System checks for conflicts
- Appointment created successfully
- Notification sent to doctor
- Appointment appears in calendar

### 3. Patient Check-in Workflow

**Step 1**: Patient Arrives
- Patient arrives at reception
- Receptionist searches for patient

**Step 2**: Check-in Patient
- Find patient's appointment
- Click "Check-in" button
- Confirm check-in

**Step 3**: Auto-process
- Appointment status changes to CHECKED_IN
- System automatically creates encounter
- Encounter status set to TRIAGE
- Nurse receives notification

### 4. Doctor Consultation Workflow

**Step 1**: View Checked-in Patients
- Login as Doctor
- Dashboard shows checked-in patients
- Select patient from list

**Step 2**: Review Patient History
- View patient demographics
- Review medical history
- Check previous encounters
- Review allergies

**Step 3**: Record Vitals
- Click "Record Vitals"
- Enter vital signs:
  - Temperature: 37.0°C
  - Blood Pressure: 120/80
  - Heart Rate: 72 bpm
  - Respiratory Rate: 16/min
  - Oxygen Saturation: 98%
  - Weight: 70 kg
  - Height: 175 cm
- Click "Save Vitals"

**Step 4**: SOAP Documentation
- Click "Add SOAP Note"
- Enter Subjective: Patient reports chest pain
- Enter Objective: BP 120/80, HR 72, normal exam
- Enter Assessment: Possible musculoskeletal pain
- Enter Plan: Rest, OTC pain meds, follow up
- Click "Save SOAP Note"

**Step 5**: Add Diagnosis
- Click "Add Diagnosis"
- Enter ICD-10 code: R07.4
- Enter description: Chest pain, unspecified
- Mark as primary diagnosis
- Click "Save Diagnosis"

**Step 6**: Prescribe Medications
- Click "Add Prescription"
- Enter medication: Ibuprofen 400mg
- Enter dosage: 400mg
- Enter frequency: Every 6 hours as needed
- Enter duration: 7 days
- Enter quantity: 28
- System checks for allergies
- Click "Add Medication"

**Step 7**: Order Lab Tests
- Click "Order Lab Tests"
- Select required tests: CBC, Lipid Panel
- Enter priority: Routine
- Add notes if needed
- Click "Order Tests"

**Step 8**: Sign-off Encounter
- Review all documentation
- Click "Sign-off Encounter"
- Enter final notes
- Confirm sign-off
- Encounter status changes to COMPLETED

### 5. Lab Workflow

**Step 1**: Receive Lab Order
- Login as Lab Technician
- Dashboard shows pending lab orders
- Select lab order from list

**Step 2**: Process Sample
- Process patient sample
- Verify patient information
- Check sample quality

**Step 3**: Enter Results
- Click "Enter Results"
- Enter test results
- Mark as normal/abnormal
- Add reference ranges
- Enter any notes
- Click "Save Results"

**Step 4**: Complete Order
- Review all results
- Click "Complete Order"
- System notifies doctor
- Order status changes to COMPLETED

### 6. Billing Workflow

**Step 1**: Generate Invoice
- Login as Accountant
- Navigate to completed encounters
- System auto-generates draft invoice
- Review invoice items

**Step 2**: Review Charges
- Verify consultation charges
- Check lab test charges
- Review medication charges
- Add any additional charges

**Step 3**: Apply Discounts
- Enter discount amount if applicable
- Enter discount reason
- System recalculates totals
- Review final total

**Step 4: Process Payment
- Click "Process Payment"
- Select payment method (Cash/Card)
- Enter payment amount
- Enter reference if needed
- Click "Process Payment"

**Step 5**: Generate Receipt
- Invoice status changes to PAID
- System generates receipt
- Print receipt for patient
- Visit marked as completed

### 7. Reporting Workflow

**Step 1**: Access Reports
- Login as Admin
- Navigate to Reports section
- Select report type

**Step 2**: Generate Report
- Select date range
- Choose report parameters
- Click "Generate Report"

**Step 3**: Review Results
- View report data
- Check visualizations
- Analyze trends

**Step 4**: Export Data
- Click "Export to CSV"
- Download file
- Use for further analysis

---

## Support & Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor system logs
- Check error rates
- Verify backup completion
- Monitor performance metrics

#### Weekly
- Review audit logs
- Check disk space
- Update security patches
- Review user access

#### Monthly
- Database maintenance
- Performance optimization
- Security audit
- User training updates

### Backup Strategy

#### Database Backups
```bash
# Automated daily backups
0 2 * * * docker-compose exec db pg_dump -U postgres clinic_db > backup_$(date +\%Y\%m\%d).sql

# Keep daily backups for 7 days
# Keep weekly backups for 4 weeks
# Keep monthly backups for 12 months
```

#### File Backups
- Backup uploaded files daily
- Store in secure location
- Test restore process monthly

### Monitoring Metrics

#### Key Performance Indicators
- API response time
- Database query performance
- Error rates
- User activity
- System uptime

#### Alert Thresholds
- API response time > 500ms
- Error rate > 1%
- Database connections > 80%
- Disk space > 90%

---

## Conclusion

This Clinic Management System provides a comprehensive solution for modern healthcare facility management. The system is designed with scalability, security, and ease of use in mind, following industry best practices for healthcare applications.

For additional support or questions, please refer to the inline code documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready  
**Documentation Version**: Complete