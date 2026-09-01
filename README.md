# Clinic Management System

The Medium Hospital/Clinic Management System is a comprehensive, paperless healthcare management platform designed to streamline hospital operations, enhance patient care, and improve operational efficiency. This system serves as a centralized solution for managing patient records, appointments, clinical documentation, laboratory services, and billing processes.

The system is specifically designed for medium-sized healthcare facilities (50-200 beds) that require robust management capabilities without the complexity and cost of enterprise systems. It provides role-based access control, ensuring that each staff member has appropriate access to the features they need while maintaining data security and patient privacy.

Key features include electronic medical records (EMR), appointment scheduling with conflict detection, automated billing, laboratory information management, and comprehensive reporting capabilities. The system is built using modern web technologies, making it accessible from any device with an internet connection while maintaining high security standards required for healthcare data.

## 🏥 Features

### Patient Management
- **MRN Generation**: Automatic Medical Record Number generation with unique identifiers
- **Patient Registration**: Complete patient profiles with demographics, contact info, and medical history
- **Enhanced Registration**: National ID, Blood Group, Emergency Contact collection
- **Search Functionality**: Advanced search across MRN, name, phone, email, and national ID
- **Duplicate Detection**: Intelligent duplicate patient detection based on key identifiers
- **Patient Editing**: Role-based editing capabilities with audit trails
- **Soft Delete**: Patient archiving instead of permanent deletion
- **Timeline View**: Unified timeline showing all patient activities

### Walk-in & Triage System
- **Walk-in Patient Management**: Support for walk-in patients without appointments
- **Automatic Triage Routing**: Patients automatically routed to triage queue on registration
- **Nurse Assignment**: Optional nurse assignment by receptionist for specific patient routing
- **Real-time Status Tracking**: Track patient progress through clinical stations
- **Activity Logging**: Comprehensive audit trail for patient movement through system

### Clinical Module (EMR)
- **Encounter Management**: Create and manage patient encounters with visit status tracking
- **Visit Status Workflow**: TRIAGE → DOCTOR_CONSULT → LAB_PENDING → LAB_READY → BILLING → COMPLETED
- **Vitals Recording**: Comprehensive vitals recording (temperature, BP, heart rate, SpO2, weight, height)
- **SOAP Notes**: Structured SOAP documentation (Subjective, Objective, Assessment, Plan)
- **Diagnosis (ICD-10)**: ICD-10 code support for diagnoses
- **Encounter Sign-off**: Provider sign-off with timestamps
- **Nurse Intake Notes**: Structured triage assessment and intake documentation
- **Patient Discharge**: Discharge workflow with encounter completion tracking

### Laboratory System
- **Lab Orders**: Create and manage lab orders from doctor encounters
- **Lab Catalogue**: Comprehensive lab test catalogue with pricing
- **Results Entry**: Lab results entry with abnormal flagging (N, H, L)
- **Lab Assignment System**: Lab tech assignment workflow with accept/reject
- **Auto Fee Integration**: Lab fees automatically added to encounter when order created
- **Auto Status Transitions**: LAB_PENDING → LAB_READY → BILLING workflow
- **Patient Context**: Lab dashboard shows patient demographics and chief complaint
- **Priority Management**: ROUTINE, URGENT, STAT priority levels
- **Result Notifications**: Automatic status updates when results are ready
- **Lab History**: Complete lab history for patients

### Billing & Payments
- **Invoice Generation**: Automated invoice generation based on encounter fees (consultation, lab tests, services)
- **Fee Configuration**: Admin-configurable pricing for services and lab tests
- **Payment Processing**: Multiple payment method support with payment tracking
- **Discounts**: Discount application and tracking
- **Financial Tracking**: Comprehensive financial reporting
- **Payment Status**: Real-time payment status tracking (DRAFT, ISSUED, PAID)
- **Visit Completion**: Patient discharge workflow with auto-discharge after payment
- **Paid Patient Visualization**: Visual indication of paid patients in waiting room
- **Receptionist Billing UI**: Dedicated billing tab for invoice management

### Reports & Analytics
- **Operational Reports**: Daily/monthly operational statistics
- **Revenue Reports**: Revenue tracking by day/month
- **Doctor Performance**: Individual doctor performance metrics
- **Financial Summary**: Complete financial overview
- **CSV Exports**: Data export capabilities

## 🚀 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Prisma** - ORM for database operations
- **PostgreSQL** - Database (via Docker)
- **TypeScript** - Type-safe development
- **JWT** - Authentication
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Context** - State management

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Clinic-Management-System
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
# Backend .env
DATABASE_URL="postgresql://clinic_user:clinic_password@localhost:5432/clinic_db?schema=public"
JWT_SECRET=your-secret-key-change-this-in-production
PORT=4000
NODE_ENV=development
```

### 3. Start Services

Start the database and backend services using Docker Compose:

```bash
docker-compose up
```

This will start:
- PostgreSQL database (port 5432)
- Backend API server (port 4000)

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 6. Database Setup

Run database migrations and seed data:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## 👥 User Roles & Credentials

The system includes the following pre-configured users:

### Admin
- **Username**: `admin`
- **Password**: `Admin@123`
- **Access**: Full system access, user management, reports

### Doctor
- **Username**: `doctor`
- **Password**: `Doctor@123`
- **Access**: Patient care, lab orders, encounters

### Receptionist
- **Username**: `receptionist`
- **Password**: `Reception@123`
- **Access**: Patient registration, walk-in management, nurse assignment, check-in

### Nurse
- **Username**: `nurse`
- **Password**: `Nurse@123`
- **Access**: Triage management, vitals recording, patient intake assessment

### Laboratorist
- **Username**: `labtech`
- **Password**: `Lab@123`
- **Access**: Lab results entry, lab order management

## 📚 API Documentation

### Authentication

All API endpoints (except login) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

#### POST /api/auth/login
Login to get JWT token

**Request:**
```json
{
  "username": "receptionist",
  "password": "Reception@123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "receptionist",
    "role": "RECEPTIONIST"
  }
}
```

### Patients

#### POST /api/patients/register
Register a new patient (automatically creates TRIAGE encounter)

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
  "emergencyContact": "+1234567890"
}
```

#### GET /api/patients/search?q=query
Search patients

#### GET /api/patients/mrn/:mrn
Get patient by MRN

#### GET /api/patients/:mrn/timeline
Get patient timeline

#### PATCH /api/patients/mrn/:mrn
Update patient information

### Encounters & Clinical Workflow

#### POST /api/medical/patients/encounter
Create encounter (for receptionist check-in with optional nurse assignment)

**Request:**
```json
{
  "patientId": "patient-id",
  "nurseId": "nurse-id", // Optional
  "visitStatus": "TRIAGE",
  "chiefComplaint": "Walk-in visit",
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan": ""
}
```

#### POST /api/medical/patients/encounter/assign-doctor
Assign doctor to encounter

#### POST /api/encounters/:id/vitals
Record patient vitals

#### POST /api/encounters/:id/soap
Add SOAP note

#### POST /api/encounters/:id/diagnosis
Add diagnosis

#### POST /api/encounters/:id/signoff
Sign off encounter

#### POST /api/encounters/:id/discharge
Discharge patient (complete encounter) - Receptionist, Doctor, Admin

**Request:**
```json
{
  "dischargeNotes": "Optional discharge notes"
}
```

### Visit Routing

#### GET /api/dashboard/reception-patients
Get all active patients for receptionist dashboard (TRIAGE, DOCTOR_CONSULT, LAB_PENDING, LAB_READY, BILLING)

#### GET /api/dashboard/nurse-patients
Get patients in TRIAGE status for nurse dashboard

#### GET /api/dashboard/doctor-patients
Get patients in DOCTOR_CONSULT status for doctor dashboard

#### GET /api/dashboard/lab-patients
Get patients in LAB_PENDING status for lab dashboard

#### GET /api/dashboard/billing-patients
Get patients in BILLING status for receptionist dashboard

#### POST /api/medical/encounter/:id/status
Change visit status (for routing between stations)

### Laboratory

#### POST /api/lab/orders
Create lab order (auto-adds lab fees to encounter, auto-transitions to LAB_PENDING)

**Request:**
```json
{
  "encounterId": "encounter-id",
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "priority": "ROUTINE",
  "notes": "Optional notes",
  "testIds": ["test-id-1", "test-id-2"] // Optional, for specific test pricing
}
```

#### POST /api/lab/orders/:id/results
Enter lab results (auto-transitions to LAB_READY)

**Request:**
```json
{
  "labTestId": "test-id",
  "value": "14.2",
  "unit": "g/dL",
  "referenceRange": "12.0 - 16.0",
  "flag": "N",
  "notes": "Optional notes"
}
```

#### POST /api/lab/orders/:id/complete
Mark lab order as completed (auto-transitions to BILLING)

#### GET /api/lab/orders/pending
Get pending lab orders

#### GET /api/lab/tests
Get lab test catalogue

#### POST /api/lab/tests
Create lab test (Admin only)

#### PATCH /api/lab/tests/:id
Update lab test (Admin only)

#### DELETE /api/lab/tests/:id
Delete lab test (Admin only)

### Billing

#### POST /api/billing/invoices
Create invoice from encounter fees (Receptionist only)

**Request:**
```json
{
  "encounterId": "encounter-id",
  "patientId": "patient-id"
}
```

#### GET /api/billing/invoices
Get all invoices (Receptionist only)

#### GET /api/billing/invoices/:invoiceId
Get invoice details

#### PATCH /api/billing/invoices/:invoiceId/mark-paid
Mark invoice as paid (Receptionist only)

#### GET /api/billing/patient/:patientId/invoices
Get all invoices for a patient (Receptionist, Admin)

#### GET /api/billing/fee-configurations
Get fee configurations (Admin only)

#### POST /api/billing/fee-configurations
Create/update fee configuration (Admin only)

**Request:**
```json
{
  "feeType": "CONSULTATION",
  "description": "General Consultation",
  "amount": 500,
  "isActive": true
}
```

### Reports

#### GET /api/reports/revenue/daily/:date
Get daily revenue report

#### GET /api/reports/revenue/monthly/:year/:month
Get monthly revenue report

#### GET /api/reports/operational?startDate=&endDate=
Get operational statistics

#### GET /api/reports/financial?startDate=&endDate=
Get financial summary

#### POST /api/reports/export/csv
Export data to CSV

## 🎯 Demo Walkthrough

### 1. System Overview

The Clinic Management System provides a unified platform for managing walk-in clinic operations. The system uses an encounter-centric workflow with real-time patient status tracking across clinical stations.

### 2. Patient Registration Workflow

1. **Login as Receptionist**: Use `receptionist` / `Reception@123`
2. **Navigate to Patient Registration**: Click "Register" tab in the dashboard
3. **Fill Patient Information**: Enter patient demographics, contact info, and medical data (National ID, Blood Group, Emergency Contact)
4. **MRN Generation**: System automatically generates unique MRN (e.g., MRN-2024-12345678)
5. **Automatic Triage Routing**: System automatically creates TRIAGE encounter and sends patient to nurse queue
6. **Confirmation**: Patient is registered and appears in nurse's triage queue

### 3. Walk-in Patient Check-in Workflow

1. **Patient Arrives**: Walk-in patient arrives at reception
2. **Search Patient**: Receptionist searches for existing patient or registers new patient
3. **Optional Nurse Assignment**: Receptionist can optionally assign a specific nurse
4. **Send to Triage**: Click "Send to Triage" button
5. **Status Update**: Patient status changes to TRIAGE
6. **Triage Queue**: Patient appears in nurse's triage queue

### 4. Nurse Triage Workflow

1. **View Triage Queue**: Nurse sees all patients in TRIAGE status
2. **Select Patient**: Choose patient from the queue
3. **Record Vitals**: Enter temperature, blood pressure, heart rate, SpO2, weight, height
4. **Intake Assessment**: Document chief complaint, current medications, allergies, medical history
5. **Send to Doctor**: Complete triage and send patient to DOCTOR_CONSULT status
6. **Status Update**: Patient appears in doctor's consultation queue

### 5. Doctor Consultation Workflow

1. **View Consultation Queue**: Doctor sees patients in DOCTOR_CONSULT status
2. **Select Patient**: Choose patient from the list
3. **Review Triage Notes**: View nurse's intake assessment and vitals
4. **Review History**: View patient's medical history and previous encounters
5. **Update Vitals**: Add or update vitals information
6. **SOAP Notes**: Document subjective, objective, assessment, and plan
7. **Add Diagnosis**: Add ICD-10 diagnosis codes
8. **Order Labs**: Order lab tests if needed (sends patient to LAB_PENDING)
9. **Complete Consultation**: Sign off encounter or route to next station

### 6. Lab Workflow

1. **Receive Lab Order**: Lab tech sees patients in LAB_PENDING status with priority badges
2. **View Patient Context**: Lab tech sees patient demographics, chief complaint, and order notes
3. **Accept Assignment**: Lab tech accepts or rejects lab assignment
4. **Process Sample**: Process the patient sample
5. **Enter Results**: Enter lab results with normal/abnormal flags (N, H, L)
6. **Auto Status Update**: Patient status auto-transitions to LAB_READY when results entered
7. **Complete Order**: Mark lab order as complete
8. **Auto Billing Transition**: Patient status auto-transitions to BILLING when lab completed
9. **Notify Doctor**: System automatically notifies doctor when results are ready

### 7. Billing Workflow

1. **View Billing Tab**: Receptionist accesses dedicated billing tab in dashboard
2. **View Invoices**: See all patient invoices with status badges (DRAFT, ISSUED, PAID)
3. **Create Invoice**: Create invoice from encounter fees (consultation, lab tests, services)
4. **Review Invoice Details**: View service breakdown, subtotal, discounts, total, balance
5. **Process Payment**: Mark invoice as paid with payment method tracking
6. **Auto-Discharge**: Patient automatically discharged after payment (or manual discharge)
7. **Patient Status Update**: Patient status changes to COMPLETED and removed from waiting room
8. **Paid Patient Visualization**: Paid patients shown with gray background in waiting room

### 9. Reporting & Analytics

1. **Access Reports**: Admin/Receptionist accesses reports dashboard
2. **Select Report Type**: Choose from revenue, operational, or financial reports
3. **Set Date Range**: Select the desired date range
4. **View Results**: Review report data and visualizations
5. **Export Data**: Export data to CSV for further analysis

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions per role
- **Input Validation**: Comprehensive input validation
- **SQL Injection Prevention**: Prisma ORM prevents SQL injection
- **XSS Protection**: Input sanitization and CSP headers
- **CORS Configuration**: Controlled cross-origin access
- **Security Headers**: Helmet.js for security headers
- **Activity Logging**: Comprehensive audit trail for patient movement and sensitive operations

## 📊 Database Schema

The system uses PostgreSQL with the following main entities:

- **Users**: System users with roles and staff profiles
- **StaffProfile**: Extended user profiles with specializations
- **Patients**: Patient information and medical history
- **Encounters**: Patient encounters with visit status tracking (TRIAGE, DOCTOR_CONSULT, LAB_PENDING, LAB_READY, BILLING)
- **Vitals**: Patient vital signs with encounter relationship
- **LabOrders**: Laboratory test orders with status tracking
- **LabResults**: Laboratory test results
- **Invoices**: Billing invoices
- **Payments**: Payment records
- **ActivityLog**: Audit trail for patient movement and system actions
- **Appointments**: Appointment scheduling (optional, for scheduled visits)

### Key Schema Changes from Original Design:
- **Encounter model**: Added `nurseId` field for nurse assignment, made `appointmentId` and `doctorId` optional
- **ActivityLog model**: New model for tracking patient movement through clinical stations
- **StaffProfile model**: Extended user profiles for professional information
- **VisitStatus enum**: Added comprehensive visit status workflow (TRIAGE, DOCTOR_CONSULT, LAB_PENDING, LAB_READY, BILLING)

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage

The system includes comprehensive test coverage for:
- API endpoints
- Service layer logic
- Authentication and authorization
- Data validation
- Error handling
- Visit routing logic

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**: Set production environment variables
2. **Database**: Configure production database
3. **Build**: Build frontend and backend
4. **Docker**: Use Docker Compose for production deployment
5. **SSL/TLS**: Configure SSL certificates
6. **Monitoring**: Set up application monitoring
7. **Backups**: Configure automated database backups

### Docker Compose Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, please contact:
- Email: support@clinic.com
- Documentation: See this README and inline code comments

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for walk-in clinic operations with triage-based workflow
- Focus on real-time patient status tracking and clinical workflow optimization
- Encounter-centric design for comprehensive patient journey tracking

---

**Version**: 2.1.0
**Last Updated**: August 31, 2026
**Status**: Production Ready (Walk-in/Triage-based System with Billing & Lab Integration)


# Apply database schema updates inside API container
docker exec -it clinic_api npx prisma db push --accept-data-loss

# Re-run initial seed data (create default users & catalogue items)
docker exec -it clinic_api npx prisma db seed
