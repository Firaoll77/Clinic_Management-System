# Clinic Management System API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user (Admin only)

**Request Body:**
```json
{
  "email": "user@clinic.com",
  "password": "Password@123",
  "fullName": "John Doe",
  "role": "DOCTOR",
  "phone": "+1234567890",
  "specialization": "Cardiology",
  "licenseNo": "MD-12345"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@clinic.com",
    "role": "DOCTOR",
    "staffProfile": { ... }
  }
}
```

#### POST /auth/login
Login user

**Request Body:**
```json
{
  "email": "user@clinic.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

#### GET /auth/me
Get current user info

#### POST /auth/logout
Logout user

### Users

#### GET /users
Get all users (Admin only)

#### GET /users/:id
Get user by ID

#### PATCH /users/:id
Update user (Admin or own profile)

#### DELETE /users/:id
Delete user (Admin only)

### Patients

#### POST /patients/register
Register a new patient

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1985-05-15",
  "gender": "MALE",
  "phone": "+1555123456",
  "email": "john.doe@example.com",
  "address": "123 Main St",
  "bloodGroup": "O+",
  "emergencyContact": "+1555987654",
  "allergies": [
    {
      "substance": "Penicillin",
      "severity": "SEVERE",
      "notes": "Anaphylactic reaction"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": "uuid",
    "mrn": "MRN-2024-123456",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

#### GET /patients/search
Search patients

**Query Parameters:**
- `query`: Search term (name, phone, MRN, national ID)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 50)

**Response:**
```json
{
  "patients": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /patients/:id
Get patient by ID

**Response includes:**
- Patient basic info (filtered by role)
- Recent appointments
- Recent encounters with vitals
- Allergies

#### PATCH /patients/:id
Update patient information

**Request Body:**
```json
{
  "firstName": "Johnathan",
  "phone": "+1555999999"
}
```

**Response:**
```json
{
  "message": "Patient updated successfully",
  "patient": { ... },
  "changes": {
    "firstName": {
      "before": "John",
      "after": "Johnathan"
    }
  }
}
```

#### POST /patients/:id/emergency-access
Request emergency access to patient data

**Request Body:**
```json
{
  "reason": "Patient unconscious, need immediate access to medical history",
  "duration": 2
}
```

**Response:**
```json
{
  "message": "Emergency access granted",
  "emergencyAccess": {
    "id": "uuid",
    "expiresAt": "2024-08-13T15:00:00Z",
    "reason": "..."
  }
}
```

#### POST /patients/:id/archive
Archive a patient (Admin only)

### Notifications

#### GET /notifications
Get notifications for current user

**Query Parameters:**
- `unreadOnly`: true/false

#### GET /notifications/unread-count
Get count of unread notifications

#### PATCH /notifications/:id/read
Mark notification as read

#### PATCH /notifications/read-all
Mark all notifications as read

## Role-Based Data Access

### Receptionist
**Can View:** Patient demographics (name, contact, address, MRN, etc.)
**Can Edit:** Name, phone, email, address, emergency contact, blood group

### Doctor
**Can View:** Full patient data including medical history
**Can Edit:** Blood group, emergency contact (medical-related fields)

### Nurse
**Can View:** Patient demographics + medical data (vitals, allergies, medications)
**Can Edit:** Blood group, emergency contact

### Lab Technician
**Can View:** Basic patient info (name, MRN, DOB, gender)
**Can Edit:** None

### Admin
**Can View:** All data
**Can Edit:** All data

## Error Responses

All errors follow this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Test Credentials

After running seed script:

### Admin
- Email: admin@clinic.com
- Password: Admin@123

### Receptionist
- Email: reception@clinic.com
- Password: Reception@123

### Doctor
- Email: doctor@clinic.com
- Password: Doctor@123

### Nurse
- Email: nurse@clinic.com
- Password: Nurse@123
