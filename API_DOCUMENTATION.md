# Clinic Management System - API Documentation

## Base URL

```
Development: http://localhost:4000/api
Production: https://clinic-management-system-1-4mxh.onrender.com/api
```

## Authentication

All API endpoints (except `/api/auth/login`, `/api/auth/refresh`) require authentication via JWT token.

The system uses token-based authentication with:
- **Access tokens**: Expire after 15 minutes
- **Refresh tokens**: Expire after 7 days

Tokens are returned in the response body and should be stored in localStorage (client-side) for use in subsequent requests.

### Headers

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Login Endpoint

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "doctor",
  "password": "Doctor@123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "username": "doctor",
    "role": "DOCTOR",
    "staffProfile": {
      "id": "staff-id",
      "fullName": "John Smith",
      "specialization": "General Medicine"
    }
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Authentication failed",
  "message": "Invalid username or password"
}
```

### Refresh Token

**POST** `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "tokens": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid token",
  "message": "Refresh token is invalid or expired"
}
```

### Logout

**POST** `/api/auth/logout`

Logout current session.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### Logout All Sessions

**POST** `/api/auth/logout-all`

Logout all sessions for the user.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "message": "All sessions logged out successfully"
}
```

---

## Patients API

### Register Patient

**POST** `/api/patients/register`

Register a new patient with automatic MRN generation.

**Roles Required:** RECEPTIONIST, DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "firstName": "Alemu",
  "lastName": "Firisa",
  "dob": "1990-01-01",
  "gender": "MALE",
  "phone": "+1234567890",
  "email": "Alemufir@example.com",
  "nationalId": "1234567890123",
  "address": "123 Main St, City, State",
  "bloodGroup": "O+",
  "emergencyContact": "+1234567890 (Alemitu Bona)",
  "allergies": [
    {
      "substance": "Penicillin",
      "severity": "SEVERE",
      "notes": "Anaphylactic reaction"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": "patient-id",
    "mrn": "MRN-2024-12345678",
    "firstName": "Alemu",
    "lastName": "Firisa",
    "dob": "1990-01-01",
    "gender": "MALE",
    "phone": "+1234567890",
    "email": "Alemufir@example.com",
    "nationalId": "1234567890123",
    "address": "123 Main St, City, State",
    "bloodGroup": "O+",
    "emergencyContact": "+1234567890 (Alemitu Bona)",
    "allergies": [...],
    "createdAt": "2024-08-20T10:00:00Z",
    "lastActivityAt": "2024-08-20T10:00:00Z"
  }
}
```

### Search Patients

**GET** `/api/patients/search?q=query`

Search patients by name, phone, MRN, email, or national ID.

**Roles Required:** All authenticated users

**Query Parameters:**
- `q` (required): Search term

**Response (200 OK):**
```json
{
  "patients": [...],
  "total": 10
}
```

### Get Patient by MRN

**GET** `/api/patients/mrn/:mrn`

Get complete patient information by MRN.

**Roles Required:** All authenticated users

**Response (200 OK):**
```json
{
  "patient": {
    "id": "patient-id",
    "mrn": "MRN-2024-12345678",
    "firstName": "John",
    "lastName": "Doe",
    ...
    "appointments": [...],
    "encounters": [...]
  }
}
```

### Get Patient Timeline

**GET** `/api/patients/:mrn/timeline`

Get unified timeline of patient activities.

**Roles Required:** All authenticated users

**Response (200 OK):**
```json
{
  "timeline": [
    {
      "type": "appointment",
      "date": "2024-08-20T10:00:00Z",
      "data": {...}
    },
    {
      "type": "encounter",
      "date": "2024-08-20T10:30:00Z",
      "data": {...}
    }
  ],
  "total": 20
}
```

### Update Patient

**PATCH** `/api/patients/mrn/:mrn`

Update patient information.

**Roles Required:** RECEPTIONIST, DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "email": "john.smith@example.com",
  "address": "456 New St, City, State",
  "bloodGroup": "A+",
  "emergencyContact": "+1234567890 (Jane Smith)"
}
```

**Response (200 OK):**
```json
{
  "message": "Patient updated successfully",
  "patient": {...}
}
```

---

## Appointments API

### Get Available Slots

**GET** `/api/appointments/available-slots/:doctorId?date=YYYY-MM-DD`

Get available time slots for a doctor on a specific date.

**Roles Required:** All authenticated users

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response (200 OK):**
```json
{
  "date": "2024-08-20T00:00:00Z",
  "availableSlots": [
    {
      "time": "09:00",
      "duration": 30,
      "available": true
    },
    {
      "time": "09:30",
      "duration": 30,
      "available": false
    }
  ],
  "totalSlots": 16,
  "availableCount": 12
}
```

### Create Appointment

**POST** `/api/appointments`

Create a new appointment.

**Roles Required:** RECEPTIONIST, DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "scheduledAt": "2024-08-20T10:00:00Z",
  "durationMin": 30,
  "reason": "Annual checkup"
}
```

**Response (201 Created):**
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "appointment-id",
    "patientId": "patient-id",
    "doctorId": "doctor-id",
    "scheduledAt": "2024-08-20T10:00:00Z",
    "durationMin": 30,
    "reason": "Annual checkup",
    "status": "SCHEDULED",
    "patient": {...}
  }
}
```

### Update Appointment Status

**PATCH** `/api/appointments/:id/status`

Transition appointment status.

**Roles Required:** RECEPTIONIST, DOCTOR, NURSE, ADMIN

**Valid Transitions:**
- SCHEDULED → CHECKED_IN
- CHECKED_IN → IN_PROGRESS
- IN_PROGRESS → COMPLETED
- Any → CANCELLED

**Request Body:**
```json
{
  "status": "CHECKED_IN"
}
```

**Response (200 OK):**
```json
{
  "message": "Appointment status updated successfully",
  "appointment": {...},
  "encounter": {...}
}
```

### Reschedule Appointment

**PATCH** `/api/appointments/:id/reschedule`

Reschedule an appointment to a new time.

**Roles Required:** RECEPTIONIST, DOCTOR, ADMIN

**Request Body:**
```json
{
  "scheduledAt": "2024-08-21T14:00:00Z",
  "reason": "Patient requested reschedule"
}
```

**Response (200 OK):**
```json
{
  "message": "Appointment rescheduled successfully",
  "appointment": {...}
}
```

### Cancel Appointment

**POST** `/api/appointments/:id/cancel`

Cancel an appointment.

**Roles Required:** RECEPTIONIST, DOCTOR, ADMIN

**Request Body:**
```json
{
  "reason": "Patient unable to attend"
}
```

**Response (200 OK):**
```json
{
  "message": "Appointment cancelled successfully",
  "appointment": {...}
}
```

---

## Visit Routing API

### Create Encounter (Receptionist Check-in)

**POST** `/api/medical/patients/encounter`

Create a new encounter with optional nurse assignment for walk-in patients.

**Roles Required:** RECEPTIONIST, ADMIN

**Request Body:**
```json
{
  "patientId": "patient-id",
  "nurseId": "nurse-id",
  "visitStatus": "TRIAGE",
  "chiefComplaint": "Walk-in visit",
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan": ""
}
```

**Response (201 Created):**
```json
{
  "encounter": {
    "id": "encounter-id",
    "patientId": "patient-id",
    "nurseId": "nurse-id",
    "visitStatus": "TRIAGE",
    "chiefComplaint": "Walk-in visit",
    "createdAt": "2024-08-20T10:00:00Z"
  }
}
```

### Get Reception Patients

**GET** `/api/dashboard/reception-patients`

Get all active patients for receptionist dashboard (TRIAGE, DOCTOR_CONSULT, LAB_PENDING, LAB_READY, BILLING).

**Roles Required:** RECEPTIONIST, ADMIN

**Response (200 OK):**
```json
{
  "activePatients": [
    {
      "id": "encounter-id",
      "patient": {
        "id": "patient-id",
        "mrn": "MRN-2024-12345678",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890"
      },
      "visitStatus": "TRIAGE",
      "createdAt": "2024-08-20T10:00:00Z"
    }
  ]
}
```

### Get Nurse Patients

**GET** `/api/dashboard/nurse-patients`

Get patients in TRIAGE status for nurse dashboard.

**Roles Required:** NURSE, ADMIN

**Response (200 OK):**
```json
{
  "triagePatients": [
    {
      "id": "encounter-id",
      "patient": {
        "id": "patient-id",
        "mrn": "MRN-2024-12345678",
        "firstName": "Alemu",
        "lastName": "Firisa",
        "phone": "+1234567890"
      },
      "visitStatus": "TRIAGE",
      "createdAt": "2024-08-20T10:00:00Z"
    }
  ]
}
```

### Get Doctor Patients

**GET** `/api/dashboard/doctor-patients`

Get patients in DOCTOR_CONSULT status for doctor dashboard.

**Roles Required:** DOCTOR, ADMIN

**Response (200 OK):**
```json
{
  "doctorPatients": [...]
}
```

### Get Lab Patients

**GET** `/api/dashboard/lab-patients`

Get patients in LAB_PENDING status for lab dashboard.

**Roles Required:** LAB_TECH, ADMIN

**Response (200 OK):**
```json
{
  "labPatients": [...]
}
```

### Get Billing Patients

**GET** `/api/dashboard/billing-patients`

Get patients in BILLING status for receptionist dashboard.

**Roles Required:** RECEPTIONIST, ADMIN

**Response (200 OK):**
```json
{
  "billingPatients": [...]
}
```

### Change Visit Status

**POST** `/api/medical/encounter/:id/status`

Change visit status for routing between clinical stations.

**Roles Required:** NURSE, DOCTOR, LAB_TECH, ADMIN

**Request Body:**
```json
{
  "visitStatus": "DOCTOR_CONSULT"
}
```

**Response (200 OK):**
```json
{
  "message": "Visit status updated successfully",
  "encounter": {
    "id": "encounter-id",
    "visitStatus": "DOCTOR_CONSULT"
  }
}
```

---

## Encounters API

### Create Encounter

**POST** `/api/encounters`

Create a new patient encounter.

**Roles Required:** DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "appointmentId": "appointment-id",
  "visitStatus": "TRIAGE",
  "chiefComplaint": "Patient experiencing chest pain"
}
```

**Response (201 Created):**
```json
{
  "message": "Encounter created successfully",
  "encounter": {
    "id": "encounter-id",
    "patientId": "patient-id",
    "doctorId": "doctor-id",
    "visitStatus": "TRIAGE",
    "chiefComplaint": "Patient experiencing chest pain",
    "patient": {...},
    "doctor": {...}
  }
}
```

### Record Vitals

**POST** `/api/encounters/:id/vitals`

Record patient vital signs.

**Roles Required:** DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "temperature": 37.5,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 72,
  "respiratoryRate": 16,
  "oxygenSaturation": 98,
  "weight": 70,
  "height": 175,
  "bmi": 22.9,
  "notes": "Patient appears stable"
}
```

**Response (201 Created):**
```json
{
  "message": "Vitals recorded successfully",
  "vitals": {
    "id": "vitals-id",
    "encounterId": "encounter-id",
    "temperature": 37.5,
    "bloodPressureSystolic": 120,
    "bloodPressureDiastolic": 80,
    ...
  }
}
```

### Add SOAP Note

**POST** `/api/encounters/:id/soap`

Add SOAP documentation to encounter.

**Roles Required:** DOCTOR, ADMIN

**Request Body:**
```json
{
  "subjective": "Patient reports chest pain for 2 days",
  "objective": "BP 120/80, HR 72, Temp 37.5°C",
  "assessment": "Possible angina, requires further investigation",
  "plan": "Order ECG, blood work, and consider cardiac workup"
}
```

**Response (200 OK):**
```json
{
  "message": "SOAP note added successfully",
  "encounter": {...}
}
```

### Add Diagnosis

**POST** `/api/encounters/:id/diagnosis`

Add ICD-10 diagnosis to encounter.

**Roles Required:** DOCTOR, ADMIN

**Request Body:**
```json
{
  "code": "I25.10",
  "description": "Atherosclerotic heart disease of native coronary artery without angina pectoris",
  "isPrimary": true,
  "notes": "Confirmed via ECG"
}
```

**Response (201 Created):**
```json
{
  "message": "Diagnosis added successfully",
  "diagnosis": {
    "id": "diagnosis-id",
    "encounterId": "encounter-id",
    "code": "I25.10",
    "description": "...",
    "isPrimary": true
  }
}
```

### Sign Off Encounter

**POST** `/api/encounters/:id/signoff`

Sign off encounter (mark as complete).

**Roles Required:** DOCTOR, ADMIN

**Response (200 OK):**
```json
{
  "message": "Encounter signed off successfully",
  "encounter": {
    "id": "encounter-id",
    "visitStatus": "COMPLETED",
    "signedOffAt": "2024-08-20T11:30:00Z",
    "signedOffBy": "doctor-id"
  }
}
```

---

## Laboratory API

### Create Lab Order

**POST** `/api/lab/orders`

Create a new lab order.

**Roles Required:** DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "encounterId": "encounter-id",
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "priority": "ROUTINE",
  "notes": "Fasting required"
}
```

**Response (201 Created):**
```json
{
  "message": "Lab order created successfully",
  "labOrder": {
    "id": "lab-order-id",
    "patientId": "patient-id",
    "doctorId": "doctor-id",
    "status": "PENDING",
    "priority": "ROUTINE"
  }
}
```

### Enter Lab Results

**POST** `/api/lab/orders/:id/results`

Enter lab test results.

**Roles Required:** LABORATORIST, ADMIN

**Request Body:**
```json
{
  "labTestId": "lab-test-id",
  "result": "Normal",
  "isAbnormal": false,
  "notes": "All values within normal range"
}
```

**Response (201 Created):**
```json
{
  "message": "Lab result entered successfully",
  "labResult": {
    "id": "lab-result-id",
    "labOrderId": "lab-order-id",
    "labTestId": "lab-test-id",
    "result": "Normal",
    "isAbnormal": false,
    "performedAt": "2024-08-20T12:00:00Z"
  }
}
```

### Get Pending Lab Orders

**GET** `/api/lab/orders/pending`

Get all pending lab orders.

**Roles Required:** LABORATORIST, ADMIN

**Response (200 OK):**
```json
{
  "labOrders": [...],
  "total": 15
}
```

### Get Lab Tests Catalogue

**GET** `/api/lab/tests`

Get all available lab tests.

**Roles Required:** All authenticated users

**Query Parameters:**
- `category` (optional): Filter by category

**Response (200 OK):**
```json
{
  "labTests": [
    {
      "id": "lab-test-id",
      "name": "Complete Blood Count",
      "code": "CBC",
      "category": "Hematology",
      "description": "Full blood count analysis",
      "sampleType": "Blood",
      "normalRange": "See reference values",
      "unit": "Various",
      "price": 25.00
    }
  ],
  "total": 50
}
```

---

## Reports API

### Daily Revenue Report

**GET** `/api/reports/revenue/daily/:date`

Get daily revenue report.

**Roles Required:** ADMIN

**Response (200 OK):**
```json
{
  "date": "2024-08-20T00:00:00Z",
  "totalInvoices": 25,
  "totalRevenue": 5250.00,
  "totalCollected": 4800.00,
  "totalPending": 450.00,
  "invoices": [...]
}
```

### Monthly Revenue Report

**GET** `/api/reports/revenue/monthly/:year/:month`

Get monthly revenue report.

**Roles Required:** ADMIN

**Response (200 OK):**
```json
{
  "year": 2024,
  "month": 8,
  "totalInvoices": 750,
  "totalRevenue": 157500.00,
  "totalCollected": 145000.00,
  "totalPending": 12500.00,
  "revenueByType": {
    "CONSULTATION": 45000.00,
    "LAB_TESTS": 37500.00,
    "PROCEDURES": 50000.00
  }
}
```

### Operational Statistics

**GET** `/api/reports/operational?startDate=&endDate=`

Get operational statistics for a date range.

**Roles Required:** ADMIN

**Response (200 OK):**
```json
{
  "period": {
    "startDate": "2024-08-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z"
  },
  "newPatients": 150,
  "totalAppointments": 1200,
  "totalEncounters": 1100,
  "totalLabOrders": 350
}
```

### Financial Summary

**GET** `/api/reports/financial?startDate=&endDate=`

Get financial summary for a date range.

**Roles Required:** ADMIN

**Response (200 OK):**
```json
{
  "period": {
    "startDate": "2024-08-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z"
  },
  "totalBilled": 157500.00,
  "totalCollected": 145000.00,
  "totalDiscounts": 5000.00,
  "totalOutstanding": 12500.00,
  "paymentMethods": {
    "CASH": 75000.00,
    "CARD": 50000.00,
    "INSURANCE": 20000.00
  },
  "totalInvoices": 750,
  "paidInvoices": 680,
  "pendingInvoices": 70
}
```

### Export to CSV

**POST** `/api/reports/export/csv`

Export data to CSV format.

**Roles Required:** ADMIN

**Request Body:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "total": 150.00
    }
  ],
  "filename": "patients_export.csv"
}
```

**Response (200 OK):**
```json
{
  "filename": "patients_export.csv",
  "content": "id,name,total\n1,Alemu Firisa,150.00",
  "mimeType": "text/csv"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate, scheduling conflict)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

API endpoints have configurable rate limiting to prevent abuse. Rate limits can be adjusted per endpoint based on system requirements.

Rate limit headers are included in responses when rate limiting is enabled:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1692537600
```

---

## Webhooks

Webhook support is planned for future releases to enable real-time notifications for events such as appointment creation, lab result readiness, and patient registration.

---

## SDK Integration

A JavaScript/TypeScript SDK is planned for future releases to simplify API integration for third-party developers.

---

## Support

For API support, please contact the system administrator or refer to the project documentation in the repository.
