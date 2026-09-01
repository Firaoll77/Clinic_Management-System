# Clinic Management System - System Specification

## Table of Contents
1. [Use Case Actors and Roles](#use-case-actors-and-roles)
2. [Database Structure](#database-structure)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)

---

## Use Case Actors and Roles

### Primary Actors

#### 1. System Administrator
**Role**: System configuration and user management
**Responsibilities**:
- User account creation and management
- Role assignment and permission management
- System configuration and settings
- Security monitoring and audit
- Database backup and recovery
- System performance monitoring
- Report generation and analysis

**Use Cases**:
- UC-ADMIN-01: Manage user accounts
- UC-ADMIN-02: Configure system settings
- UC-ADMIN-03: Monitor system performance
- UC-ADMIN-04: Generate administrative reports
- UC-ADMIN-05: Manage database backups
- UC-ADMIN-06: Audit system access

#### 2. Receptionist
**Role**: Patient registration, walk-in management, and billing
**Responsibilities**:
- Patient registration and profile management
- Walk-in patient check-in and triage routing
- Optional nurse assignment for patients
- Patient search and information retrieval
- Front desk operations
- Basic patient communication
- Patient status monitoring
- Invoice generation and management
- Payment processing
- Patient discharge

**Use Cases**:
- UC-RECEP-01: Register new patient
- UC-RECEP-02: Search patient information
- UC-RECEP-03: Check-in walk-in patients
- UC-RECEP-04: Assign nurse to patient
- UC-RECEP-05: Send patient to triage
- UC-RECEP-06: Monitor patient status
- UC-RECEP-07: Manage patient records
- UC-RECEP-08: View active patients by visit status
- UC-RECEP-09: Generate patient invoices
- UC-RECEP-10: Process payments
- UC-RECEP-11: Mark invoices as paid
- UC-RECEP-12: Discharge patients
- UC-RECEP-13: View billing history

#### 3. Doctor
**Role**: Patient care and clinical documentation
**Responsibilities**:
- Patient consultation and examination
- Medical history review
- Vital signs assessment
- SOAP note documentation
- Diagnosis and treatment planning
- Prescription management
- Lab order management
- Encounter sign-off
- Patient follow-up coordination

**Use Cases**:
- UC-DOCTOR-01: View patient schedule
- UC-DOCTOR-02: Conduct patient consultation
- UC-DOCTOR-03: Record patient vitals
- UC-DOCTOR-04: Document SOAP notes
- UC-DOCTOR-05: Add diagnosis codes
- UC-DOCTOR-06: Prescribe medications
- UC-DOCTOR-07: Order laboratory tests
- UC-DOCTOR-08: Sign off encounters
- UC-DOCTOR-09: Review lab results
- UC-DOCTOR-10: Manage patient prescriptions

#### 4. Nurse
**Role**: Patient triage and clinical assessment
**Responsibilities**:
- Patient triage and initial assessment
- Vital signs measurement and recording
- Patient intake documentation (chief complaint, medications, allergies, medical history)
- Patient preparation for doctor examination
- Basic patient care
- Medication administration support
- Patient education
- Patient routing to doctor consultation
- Triage queue management

**Use Cases**:
- UC-NURSE-01: View triage queue
- UC-NURSE-02: Perform patient triage assessment
- UC-NURSE-03: Record patient vitals
- UC-NURSE-04: Document intake notes
- UC-NURSE-05: Send patient to doctor consultation
- UC-NURSE-06: Monitor patient status
- UC-NURSE-07: Coordinate patient flow
- UC-NURSE-08: Patient education

#### 5. Laboratory Technician
**Role**: Laboratory testing and results management with enhanced workflow
**Responsibilities**:
- Sample collection and processing
- Laboratory test execution
- Results entry and validation
- Quality control
- Equipment maintenance
- Lab catalogue management
- Result reporting
- Lab order prioritization
- Lab assignment management (accept/reject)
- Patient context review

**Use Cases**:
- UC-LAB-01: Receive lab orders with patient context
- UC-LAB-02: Accept/reject lab assignments
- UC-LAB-03: Process lab samples
- UC-LAB-04: Enter lab results with flags
- UC-LAB-05: Validate results
- UC-LAB-06: Report results to doctors
- UC-LAB-07: Complete lab orders
- UC-LAB-08: Manage lab inventory
- UC-LAB-09: Quality control
- UC-LAB-10: Equipment maintenance

### Secondary Actors

#### 8. Patient
**Role**: Healthcare service recipient
**Responsibilities**:
- Provide personal information
- Attend scheduled appointments
- Follow treatment plans
- Provide feedback
- Make payments
- Access personal health information

**Use Cases**:
- UC-PATIENT-01: Provide personal information
- UC-PATIENT-02: Attend appointments
- UC-PATIENT-03: View appointment schedule
- UC-PATIENT-04: Access medical records
- UC-PATIENT-05: Make payments
- UC-PATIENT-06: Provide feedback

#### 9. System (Automated Processes)
**Role**: Background automation and notifications
**Responsibilities**:
- Automated appointment reminders
- Lab result notifications
- Prescription alerts
- System backups
- Data synchronization
- Security monitoring
- Performance optimization

**Use Cases**:
- UC-SYSTEM-01: Send appointment reminders
- UC-SYSTEM-02: Notify lab results
- UC-SYSTEM-03: Prescription alerts
- UC-SYSTEM-04: Automated backups
- UC-SYSTEM-05: Data synchronization
- UC-SYSTEM-06: Security monitoring

---

## Database Structure

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     User        │         │  StaffProfile   │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────│ userId (FK, PK) │
│ email           │         │ fullName        │
│ passwordHash    │         │ specialization  │
│ role            │         │ licenseNo       │
│ isActive        │         │ phone           │
│ lastLoginAt     │         │ departmentId    │
│ createdAt       │         │ createdAt       │
│ updatedAt       │         │ updatedAt       │
└─────────────────┘         └────────┬────────┘
                                       │
                                       │ 1:N
                                       │
                              ┌────────▼────────┐
                              │DoctorAvailability│
                              ├─────────────────┤
                              │ id (PK)         │
                              │ doctorId (FK)   │
                              │ weekday         │
                              │ startTime       │
                              │ endTime         │
                              │ slotMinutes     │
                              │ effectiveFrom   │
                              │ effectiveTo     │
                              └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│    Patient      │         │ PatientAllergy  │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────│ patientId (FK)  │
│ mrn (unique)    │         │ substance       │
│ firstName       │         │ severity        │
│ lastName        │         │ notes           │
│ dob             │         │ createdAt       │
│ gender          │         │ updatedAt       │
│ phone           │         └─────────────────┘
│ email           │
│ nationalId      │         ┌─────────────────┐
│ address         │         │ EmergencyAccess │
│ bloodGroup      │         ├─────────────────┤
│ emergencyContact│◄────────│ patientId (FK)  │
│ isArchived      │         │ userId (FK)     │
│ archivedAt      │         │ reason          │
│ lastActivityAt  │         │ authorizedBy    │
│ createdAt       │         │ authorizedAt    │
│ updatedAt       │         │ expiresAt       │
└────────┬────────┘         │ isRevoked       │
         │                  │ revokedAt       │
         │ 1:N              │ revokedBy       │
         │                  │ createdAt       │
         │                  └─────────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │                                         │
    │ 1:N                                     │ 1:N
    │                                         │
┌───▼────────┐  ┌──────────────┐  ┌─────────▼────────┐
│Appointment │  │  Encounter   │  │     Invoice      │
├────────────┤  ├──────────────┤  ├─────────────────┤
│ id (PK)    │  │ id (PK)      │  │ id (PK)         │
│ patientId  │  │ appointmentId│  │ invoiceNo       │
│ doctorId   │  │ patientId    │  │ patientId       │
│ scheduledAt│  │ doctorId     │  │ encounterId     │
│ durationMin│  │ chiefComplaint│  │ status          │
│ status     │  │ subjective   │  │ subtotal        │
│ reason     │  │ objective    │  │ discountAmount  │
│ createdBy  │  │ assessment   │  │ taxAmount       │
│ cancelled  │  │ plan         │  │ total           │
│ reason     │  │ icd10Code    │  │ balance         │
│ createdAt  │  │ visitStatus  │  │ issuedAt       │
│ updatedAt  │  │ signedAt     │  │ createdBy       │
└────────────┘  │ signedBy     │  │ createdAt       │
               │ createdAt    │  │ updatedAt       │
               │ updatedAt    │  └────────┬────────┘
               └──────┬───────┘           │
                      │ 1:N                │ 1:N
                      │                    │
         ┌────────────┴────────────┐       │
         │                         │       │
         │ 1:N                     │ 1:N   │ 1:N
         │                         │       │
    ┌────▼─────┐  ┌─────────┐  ┌───▼───┐ ┌───▼────────┐
    │  Vital   │  │Prescr. │  │LabOrd│  │InvoiceItem│
    ├──────────┤  ├─────────┤  ├──────┤ ├────────────┤
    │id (PK)   │  │id (PK)  │  │id(PK)│  │id (PK)     │
    │encounterId│  │encounter│  │encount│  │invoiceId   │
    │temperature│  │patientId│  │patient│  │itemType    │
    │systolic  │  │doctorId │  │ordered│  │refId       │
    │diastolic │  │status   │  │status │  │description │
    │pulse     │  │issuedAt │  │ordered│  │quantity    │
    │respRate  │  │notes    │  │complet│  │unitPrice   │
    │spo2      │  │createdAt│  │createdAt│  │lineTotal   │
    │weightKg  │  │updatedAt│  │updatedAt│  │createdAt   │
    │heightCm  │  └────┬────┘  └───────┘  └────────────┘
    │bmi       │       │ 1:N
    │recordedBy│       │
    │recordedAt│  ┌─────▼──────────┐
    └──────────┘  │PrescriptionItem│
                   ├────────────────┤
                   │id (PK)         │
                   │prescriptionId  │
                   │inventoryItemId │
                   │drugName        │
                   │dosage          │
                   │frequency       │
                   │durationDays    │
                   │route           │
                   │instructions    │
                   │quantity        │
                   │createdAt       │
                   │updatedAt       │
                   └────────────────┘

┌─────────────────┐         ┌─────────────────┐
│    LabResult     │         │    LabTest      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────│ id (PK)         │
│ labOrderId (FK) │         │ code (unique)   │
│ labTestId (FK)   │         │ name            │
│ value           │         │ department      │
│ unit            │         │ price           │
│ referenceRange  │         │ referenceRange  │
│ flag            │         │ unit            │
│ enteredBy       │         │ isActive        │
│ enteredAt       │         │ createdAt       │
└─────────────────┘         │ updatedAt       │
                            └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│    Payment      │         │ InventoryItem   │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ invoiceId (FK)  │         │ name            │
│ amount          │         │ genericName     │
│ method          │         │ form            │
│ reference       │         │ strength        │
│ receivedBy      │         │ unitPrice       │
│ receivedAt      │         │ reorderLevel    │
└─────────────────┘         │ isActive        │
                            │ createdAt       │
                            │ updatedAt       │
                            └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│  Notification   │         │   AuditLog      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ userId (FK)     │         │ actorUserId     │
│ patientId (FK) │         │ actorRole       │
│ type            │         │ action          │
│ title           │         │ entityType      │
│ message         │         │ entityId        │
│ data            │         │ fieldName       │
│ isRead          │         │ before          │
│ readAt          │         │ after           │
│ expiresAt       │         │ reason          │
│ createdAt       │         │ ip              │
└─────────────────┘         │ userAgent       │
                            │ createdAt       │
                            └─────────────────┘

┌─────────────────┐
│  ActivityLog    │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ action          │
│ entityType      │
│ entityId        │
│ details         │
│ createdAt       │
└─────────────────┘
```

### Database Schema Details

#### 1. User Table
**Purpose**: Store system user accounts and authentication credentials

**Columns**:
- `id` (UUID, Primary Key): Unique user identifier
- `email` (String, Unique): User email address for login
- `passwordHash` (String): Bcrypt hashed password
- `role` (Enum): User role (ADMIN, RECEPTIONIST, DOCTOR, NURSE, LAB_TECH, ACCOUNTANT)
- `isActive` (Boolean): Account active status
- `lastLoginAt` (DateTime, Nullable): Last successful login timestamp
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `email`
- Index on `isActive`

**Relationships**:
- One-to-one with StaffProfile

#### 2. StaffProfile Table
**Purpose**: Store detailed staff information

**Columns**:
- `id` (UUID, Primary Key): Unique profile identifier
- `userId` (UUID, Foreign Key, Unique): Reference to User
- `fullName` (String): Staff member's full name
- `specialization` (String, Nullable): Medical specialization
- `licenseNo` (String, Nullable): Professional license number
- `departmentId` (String, Nullable): Department identifier
- `phone` (String, Nullable): Contact phone number
- `createdAt` (DateTime): Profile creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `userId`
- Index on `departmentId`

**Relationships**:
- Many-to-one with User
- One-to-many with DoctorAvailability

#### 3. DoctorAvailability Table
**Purpose**: Store doctor availability schedules

**Columns**:
- `id` (UUID, Primary Key): Unique availability identifier
- `doctorId` (UUID, Foreign Key): Reference to StaffProfile
- `weekday` (Integer): Day of week (0-6, Sunday-Saturday)
- `startTime` (String): Start time in HH:MM format
- `endTime` (String): End time in HH:MM format
- `slotMinutes` (Integer): Duration of each appointment slot
- `effectiveFrom` (DateTime): Schedule effective start date
- `effectiveTo` (DateTime, Nullable): Schedule effective end date
- `createdAt` (DateTime): Availability creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `doctorId`
- Composite index on `doctorId` and `weekday`

**Relationships**:
- Many-to-one with StaffProfile

#### 4. Patient Table
**Purpose**: Store patient demographic and medical information

**Columns**:
- `id` (UUID, Primary Key): Unique patient identifier
- `mrn` (String, Unique): Medical Record Number (MRN-YYYY-XXXXXXXX)
- `firstName` (String): Patient's first name
- `lastName` (String): Patient's last name
- `dob` (DateTime): Date of birth
- `gender` (String): Gender (MALE/FEMALE/OTHER)
- `phone` (String): Contact phone number
- `email` (String, Nullable): Email address
- `nationalId` (String, Unique, Nullable): National identification number
- `address` (String, Nullable): Residential address
- `bloodGroup` (String, Nullable): Blood type
- `emergencyContact` (String, Nullable): Emergency contact information
- `isArchived` (Boolean): Archive status (soft delete)
- `archivedAt` (DateTime, Nullable): Archive timestamp
- `lastActivityAt` (DateTime): Last activity timestamp
- `createdAt` (DateTime): Patient registration timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `mrn`
- Unique index on `nationalId`
- Index on `phone`
- Index on `isArchived`
- Index on `lastActivityAt`

**Relationships**:
- One-to-many with Appointment
- One-to-many with Encounter
- One-to-many with Invoice
- One-to-many with PatientAllergy
- One-to-many with EmergencyAccess

#### 5. PatientAllergy Table
**Purpose**: Store patient allergy information

**Columns**:
- `id` (UUID, Primary Key): Unique allergy identifier
- `patientId` (UUID, Foreign Key): Reference to Patient
- `substance` (String): Allergenic substance
- `severity` (String, Nullable): Severity level (MILD/MODERATE/SEVERE)
- `notes` (String, Nullable): Additional notes
- `createdAt` (DateTime): Allergy record timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `patientId`

**Relationships**:
- Many-to-one with Patient

#### 6. EmergencyAccess Table
**Purpose**: Store emergency access grants for patient records

**Columns**:
- `id` (UUID, Primary Key): Unique access identifier
- `patientId` (UUID, Foreign Key): Reference to Patient
- `userId` (UUID, Foreign Key): Reference to User
- `reason` (String): Reason for emergency access
- `authorizedBy` (String, Nullable): Authorizing user
- `authorizedAt` (DateTime, Nullable): Authorization timestamp
- `expiresAt` (DateTime, Nullable): Access expiration timestamp
- `isRevoked` (Boolean): Revocation status
- `revokedAt` (DateTime, Nullable): Revocation timestamp
- `revokedBy` (String, Nullable): Revoking user
- `createdAt` (DateTime): Access grant timestamp

**Indexes**:
- Primary key on `id`
- Index on `patientId`
- Index on `userId`
- Index on `expiresAt`

**Relationships**:
- Many-to-one with Patient

#### 7. Appointment Table
**Purpose**: Store appointment scheduling information

**Columns**:
- `id` (UUID, Primary Key): Unique appointment identifier
- `patientId` (UUID, Foreign Key): Reference to Patient
- `doctorId` (UUID, Foreign Key): Reference to StaffProfile
- `scheduledAt` (DateTime): Scheduled appointment time
- `durationMin` (Integer): Appointment duration in minutes
- `status` (Enum): Appointment status (SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- `reason` (String, Nullable): Reason for appointment
- `createdBy` (String, Nullable): User who created appointment
- `cancelledReason` (String, Nullable): Reason for cancellation
- `createdAt` (DateTime): Appointment creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique constraint on `doctorId` and `scheduledAt`
- Index on `doctorId` and `scheduledAt`
- Index on `patientId`

**Relationships**:
- Many-to-one with Patient
- Many-to-one with StaffProfile (as doctor)
- One-to-one with Encounter

#### 8. Encounter Table
**Purpose**: Store patient encounter/visit information with visit status tracking

**Columns**:
- `id` (UUID, Primary Key): Unique encounter identifier
- `appointmentId` (UUID, Foreign Key, Unique, Nullable): Reference to Appointment (optional for walk-ins)
- `patientId` (UUID, Foreign Key): Reference to Patient
- `nurseId` (UUID, Foreign Key, Nullable): Reference to StaffProfile (assigned nurse)
- `doctorId` (UUID, Foreign Key, Nullable): Reference to StaffProfile (assigned doctor)
- `chiefComplaint` (String, Nullable): Patient's chief complaint
- `subjective` (String, Nullable): SOAP subjective data
- `objective` (String, Nullable): SOAP objective data
- `assessment` (String, Nullable): SOAP assessment data
- `plan` (String, Nullable): SOAP plan data
- `icd10Code` (String, Nullable): ICD-10 diagnosis code
- `visitStatus` (Enum): Visit status (TRIAGE, DOCTOR_CONSULT, LAB_PENDING, LAB_READY, BILLING, COMPLETED)
- `signedAt` (DateTime, Nullable): Sign-off timestamp
- `signedBy` (String, Nullable): User who signed off
- `dischargeNotes` (String, Nullable): Discharge notes
- `createdAt` (DateTime): Encounter creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `appointmentId`
- Index on `patientId`
- Index on `visitStatus`
- Index on `nurseId`

**Relationships**:
- Many-to-one with Patient
- Many-to-one with StaffProfile (as nurse)
- Many-to-one with StaffProfile (as doctor)
- One-to-one with Appointment (optional)
- One-to-many with Vital
- One-to-many with Prescription
- One-to-many with LabOrder
- One-to-many with Attachment
- One-to-many with Invoice

#### 9. Vital Table
**Purpose**: Store patient vital signs

**Columns**:
- `id` (UUID, Primary Key): Unique vital identifier
- `encounterId` (UUID, Foreign Key): Reference to Encounter
- `temperatureC` (Float, Nullable): Temperature in Celsius
- `systolic` (Integer, Nullable): Systolic blood pressure
- `diastolic` (Integer, Nullable): Diastolic blood pressure
- `pulse` (Integer, Nullable): Heart rate (bpm)
- `respRate` (Integer, Nullable): Respiratory rate
- `spo2` (Integer, Nullable): Oxygen saturation (%)
- `weightKg` (Float, Nullable): Weight in kilograms
- `heightCm` (Float, Nullable): Height in centimeters
- `bmi` (Float, Nullable): Body Mass Index
- `recordedBy` (String): User who recorded vitals
- `recordedAt` (DateTime): Recording timestamp

**Indexes**:
- Primary key on `id`
- Index on `encounterId`

**Relationships**:
- Many-to-one with Encounter

#### 10. Prescription Table
**Purpose**: Store prescription information

**Columns**:
- `id` (UUID, Primary Key): Unique prescription identifier
- `encounterId` (UUID, Foreign Key): Reference to Encounter
- `patientId` (UUID, Foreign Key): Reference to Patient
- `doctorId` (UUID, Foreign Key): Reference to StaffProfile
- `status` (Enum): Prescription status (PENDING, PARTIALLY_DISPENSED, DISPENSED, CANCELLED)
- `issuedAt` (DateTime): Prescription issue timestamp
- `notes` (String, Nullable): Additional notes
- `createdAt` (DateTime): Prescription creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `encounterId`
- Index on `patientId`

**Relationships**:
- Many-to-one with Encounter
- Many-to-one with Patient
- Many-to-one with StaffProfile (as doctor)
- One-to-many with PrescriptionItem

#### 11. PrescriptionItem Table
**Purpose**: Store individual medication items in prescriptions

**Columns**:
- `id` (UUID, Primary Key): Unique item identifier
- `prescriptionId` (UUID, Foreign Key): Reference to Prescription
- `inventoryItemId` (UUID, Foreign Key, Nullable): Reference to InventoryItem
- `drugName` (String): Medication name
- `dosage` (String): Dosage information
- `frequency` (String): Administration frequency
- `durationDays` (Integer): Duration in days
- `route` (String, Nullable): Administration route
- `instructions` (String, Nullable): Special instructions
- `quantity` (Integer): Total quantity
- `createdAt` (DateTime): Item creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `prescriptionId`
- Index on `inventoryItemId`

**Relationships**:
- Many-to-one with Prescription
- Many-to-one with InventoryItem
- One-to-many with DispenseRecord

#### 12. LabTest Table
**Purpose**: Store laboratory test catalogue

**Columns**:
- `id` (UUID, Primary Key): Unique test identifier
- `code` (String, Unique): Test code
- `name` (String): Test name
- `department` (String): Laboratory department
- `price` (Decimal): Test price
- `referenceRange` (String, Nullable): Normal reference range
- `unit` (String, Nullable): Unit of measurement
- `isActive` (Boolean): Active status
- `createdAt` (DateTime): Test creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `code`
- Index on `isActive`

**Relationships**:
- One-to-many with LabResult

#### 13. LabOrder Table
**Purpose**: Store laboratory test orders

**Columns**:
- `id` (UUID, Primary Key): Unique order identifier
- `encounterId` (UUID, Foreign Key): Reference to Encounter
- `patientId` (UUID, Foreign Key): Reference to Patient
- `orderedBy` (String, Foreign Key): User who ordered tests
- `status` (Enum): Order status (ORDERED, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority` (String): Priority level (ROUTINE, URGENT, STAT)
- `notes` (String, Nullable): Order notes
- `orderedAt` (DateTime): Order timestamp
- `completedAt` (DateTime, Nullable): Completion timestamp
- `createdAt` (DateTime): Order creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `encounterId`
- Index on `patientId`
- Index on `status`

**Relationships**:
- Many-to-one with Encounter
- Many-to-one with Patient
- One-to-many with LabResult

#### 14. LabResult Table
**Purpose**: Store laboratory test results

**Columns**:
- `id` (UUID, Primary Key): Unique result identifier
- `labOrderId` (UUID, Foreign Key): Reference to LabOrder
- `labTestId` (UUID, Foreign Key): Reference to LabTest
- `value` (String): Test result value
- `unit` (String, Nullable): Unit of measurement
- `referenceRange` (String, Nullable): Reference range
- `flag` (String, Nullable): Result flag (H/L/N)
- `enteredBy` (String): User who entered result
- `enteredAt` (DateTime): Entry timestamp

**Indexes**:
- Primary key on `id`
- Index on `labOrderId`
- Index on `labTestId`

**Relationships**:
- Many-to-one with LabOrder
- Many-to-one with LabTest

#### 15. Service Table
**Purpose**: Store medical services catalogue

**Columns**:
- `id` (UUID, Primary Key): Unique service identifier
- `code` (String, Unique): Service code
- `name` (String): Service name
- `category` (String, Nullable): Service category
- `price` (Decimal): Service price
- `isActive` (Boolean): Active status
- `createdAt` (DateTime): Service creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `code`
- Index on `isActive`

#### 16. InventoryItem Table
**Purpose**: Store pharmacy inventory items

**Columns**:
- `id` (UUID, Primary Key): Unique item identifier
- `name` (String): Item name
- `genericName` (String, Nullable): Generic name
- `form` (String, Nullable): Medication form
- `strength` (String, Nullable): Medication strength
- `unitPrice` (Decimal): Unit price
- `reorderLevel` (Integer): Reorder level
- `isActive` (Boolean): Active status
- `createdAt` (DateTime): Item creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `isActive`

**Relationships**:
- One-to-many with PrescriptionItem
- One-to-many with InventoryBatch

#### 17. InventoryBatch Table
**Purpose**: Store inventory batch information

**Columns**:
- `id` (UUID, Primary Key): Unique batch identifier
- `itemId` (UUID, Foreign Key): Reference to InventoryItem
- `batchNo` (String): Batch number
- `expiryDate` (DateTime): Expiry date
- `quantityOnHand` (Integer): Current quantity
- `costPrice` (Decimal): Cost price
- `createdAt` (DateTime): Batch creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `itemId`
- Index on `expiryDate`

**Relationships**:
- Many-to-one with InventoryItem
- One-to-many with DispenseRecord

#### 18. DispenseRecord Table
**Purpose**: Store medication dispensing records

**Columns**:
- `id` (UUID, Primary Key): Unique record identifier
- `prescriptionItemId` (UUID, Foreign Key): Reference to PrescriptionItem
- `batchId` (UUID, Foreign Key): Reference to InventoryBatch
- `quantity` (Integer): Dispensed quantity
- `dispensedBy` (String): User who dispensed
- `dispensedAt` (DateTime): Dispensing timestamp

**Indexes**:
- Primary key on `id`
- Index on `prescriptionItemId`
- Index on `batchId`

**Relationships**:
- Many-to-one with PrescriptionItem
- Many-to-one with InventoryBatch

#### 19. Invoice Table
**Purpose**: Store billing invoices

**Columns**:
- `id` (UUID, Primary Key): Unique invoice identifier
- `invoiceNo` (String, Unique): Invoice number
- `patientId` (UUID, Foreign Key): Reference to Patient
- `encounterId` (UUID, Foreign Key, Nullable): Reference to Encounter
- `status` (Enum): Invoice status (DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID, REFUNDED)
- `subtotal` (Decimal): Invoice subtotal
- `discountAmount` (Decimal, Nullable): Discount amount
- `discountReason` (String, Nullable): Discount reason
- `taxAmount` (Decimal, Nullable): Tax amount
- `total` (Decimal): Total amount
- `balance` (Decimal): Outstanding balance
- `issuedAt` (DateTime, Nullable): Issue timestamp
- `createdBy` (String, Nullable): User who created invoice
- `createdAt` (DateTime): Invoice creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Unique index on `invoiceNo`
- Index on `patientId` and `status`

**Relationships**:
- Many-to-one with Patient
- Many-to-one with Encounter
- One-to-many with InvoiceItem
- One-to-many with Payment

#### 20. InvoiceItem Table
**Purpose**: Store individual invoice line items

**Columns**:
- `id` (UUID, Primary Key): Unique item identifier
- `invoiceId` (UUID, Foreign Key): Reference to Invoice
- `itemType` (String): Item type (SERVICE/LAB/DRUG)
- `refId` (String, Nullable): Reference to original item
- `description` (String): Item description
- `quantity` (Integer): Item quantity
- `unitPrice` (Decimal): Unit price
- `lineTotal` (Decimal): Line total
- `createdAt` (DateTime): Item creation timestamp

**Indexes**:
- Primary key on `id`
- Index on `invoiceId`

**Relationships**:
- Many-to-one with Invoice

#### 21. Payment Table
**Purpose**: Store payment records

**Columns**:
- `id` (UUID, Primary Key): Unique payment identifier
- `invoiceId` (UUID, Foreign Key): Reference to Invoice
- `amount` (Decimal): Payment amount
- `method` (Enum): Payment method (CASH, CARD, MOBILE_MONEY, BANK_TRANSFER)
- `reference` (String, Nullable): Payment reference
- `receivedBy` (String): User who received payment
- `receivedAt` (DateTime): Payment timestamp

**Indexes**:
- Primary key on `id`
- Index on `invoiceId`

**Relationships**:
- Many-to-one with Invoice

#### 22. Attachment Table
**Purpose**: Store file attachments for encounters

**Columns**:
- `id` (UUID, Primary Key): Unique attachment identifier
- `encounterId` (UUID, Foreign Key): Reference to Encounter
- `fileName` (String): File name
- `mimeType` (String): MIME type
- `sizeBytes` (Integer): File size in bytes
- `storagePath` (String): Storage file path
- `uploadedBy` (String): User who uploaded file
- `createdAt` (DateTime): Upload timestamp

**Indexes**:
- Primary key on `id`
- Index on `encounterId`

**Relationships**:
- Many-to-one with Encounter

#### 23. Notification Table
**Purpose**: Store system notifications

**Columns**:
- `id` (UUID, Primary Key): Unique notification identifier
- `userId` (UUID, Foreign Key, Nullable): Reference to User
- `patientId` (UUID, Foreign Key, Nullable): Reference to Patient
- `type` (String): Notification type
- `title` (String): Notification title
- `message` (String): Notification message
- `data` (String, Nullable): Additional data (JSON)
- `isRead` (Boolean): Read status
- `readAt` (DateTime, Nullable): Read timestamp
- `expiresAt` (DateTime, Nullable): Expiration timestamp
- `createdAt` (DateTime): Creation timestamp

**Indexes**:
- Primary key on `id`
- Index on `userId`
- Index on `patientId`
- Index on `isRead`
- Index on `createdAt`

#### 24. AuditLog Table
**Purpose**: Store audit trail for sensitive operations

**Columns**:
- `id` (UUID, Primary Key): Unique log identifier
- `actorUserId` (String): User who performed action
- `actorRole` (String): Role of actor
- `action` (String): Action performed
- `entityType` (String): Type of entity affected
- `entityId` (String): ID of entity affected
- `fieldName` (String, Nullable): Field that was modified
- `before` (String, Nullable): Previous value (JSON)
- `after` (String, Nullable): New value (JSON)
- `reason` (String, Nullable): Reason for change
- `ip` (String, Nullable): IP address
- `userAgent` (String, Nullable): User agent
- `createdAt` (DateTime): Log timestamp

**Indexes**:
- Primary key on `id`
- Index on `actorUserId`
- Index on `entityType` and `entityId`
- Index on `createdAt`

#### 25. EncounterFee Table
**Purpose**: Store encounter fees for billing

**Columns**:
- `id` (UUID, Primary Key): Unique fee identifier
- `encounterId` (UUID, Foreign Key): Reference to Encounter
- `feeType` (Enum): Fee type (CONSULTATION, LAB_TEST, SERVICE, PROCEDURE)
- `description` (String): Fee description
- `amount` (Decimal): Fee amount
- `loggedBy` (String): User who logged the fee
- `createdAt` (DateTime): Fee creation timestamp

**Indexes**:
- Primary key on `id`
- Index on `encounterId`
- Index on `feeType`

**Relationships**:
- Many-to-one with Encounter

#### 26. LabAssignment Table
**Purpose**: Store lab technician assignments

**Columns**:
- `id` (UUID, Primary Key): Unique assignment identifier
- `labOrderId` (UUID, Foreign Key): Reference to LabOrder
- `labTechId` (UUID, Foreign Key): Reference to StaffProfile
- `assignedBy` (String): User who made assignment
- `assignedAt` (DateTime): Assignment timestamp
- `status` (Enum): Assignment status (PENDING, ACCEPTED, REJECTED, COMPLETED)
- `completedAt` (DateTime, Nullable): Completion timestamp

**Indexes**:
- Primary key on `id`
- Index on `labOrderId`
- Index on `labTechId`
- Index on `status`

**Relationships**:
- Many-to-one with LabOrder
- Many-to-one with StaffProfile

#### 27. FeeConfiguration Table
**Purpose**: Store fee configurations for services

**Columns**:
- `id` (UUID, Primary Key): Unique configuration identifier
- `feeType` (Enum): Fee type (CONSULTATION, LAB_TEST, SERVICE, PROCEDURE)
- `description` (String): Fee description
- `amount` (Decimal): Fee amount
- `isActive` (Boolean): Active status
- `createdAt` (DateTime): Configuration creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes**:
- Primary key on `id`
- Index on `feeType`
- Index on `isActive`

---

## Functional Requirements

### FR-1: User Management
**FR-1.1**: The system shall allow administrators to create, update, and deactivate user accounts.
**FR-1.2**: The system shall assign appropriate roles to users based on their job functions.
**FR-1.3**: The system shall enforce role-based access control for all system features.
**FR-1.4**: The system shall require users to authenticate with email and password.
**FR-1.5**: The system shall implement secure password storage using bcrypt hashing.
**FR-1.6**: The system shall provide password reset functionality for users.
**FR-1.7**: The system shall log all user login attempts and access.
**FR-1.8**: The system shall allow administrators to view user activity logs.

### FR-2: Patient Management
**FR-2.1**: The system shall allow receptionists to register new patients with complete demographic information.
**FR-2.2**: The system shall automatically generate unique Medical Record Numbers (MRN) in the format MRN-YYYY-XXXXXXXX.
**FR-2.3**: The system shall detect duplicate patients based on name, date of birth, phone, and national ID.
**FR-2.4**: The system shall allow authorized users to search patients by MRN, name, phone, email, or national ID.
**FR-2.5**: The system shall display comprehensive patient profiles including demographics, contact info, and medical history.
**FR-2.6**: The system shall allow authorized users to update patient information.
**FR-2.7**: The system shall implement patient archiving (soft delete) instead of permanent deletion.
**FR-2.8**: The system shall maintain a unified timeline of all patient activities.
**FR-2.9**: The system shall allow users to record patient allergies with severity levels.
**FR-2.10**: The system shall provide emergency contact information for patients.

### FR-3: Appointment Management
**FR-3.1**: The system shall allow authorized users to schedule appointments for patients with doctors.
**FR-3.2**: The system shall display doctor availability in calendar views (Month, Week, Day).
**FR-3.3**: The system shall prevent double-booking of time slots for the same doctor.
**FR-3.4**: The system shall allow users to reschedule appointments with conflict detection.
**FR-3.5**: The system shall allow users to cancel appointments with reason tracking.
**FR-3.6**: The system shall implement validated appointment status transitions (SCHEDULED → CHECKED_IN → IN_PROGRESS → COMPLETED).
**FR-3.7**: The system shall automatically create patient encounters when patients are checked in.
**FR-3.8**: The system shall send appointment reminders to patients and doctors.
**FR-3.9**: The system shall display appointment history and status changes.
**FR-3.10**: The system shall allow doctors to view their upcoming appointments.

### FR-4: Clinical Documentation (EMR)
**FR-4.1**: The system shall allow doctors to create patient encounters.
**FR-4.2**: The system shall allow nurses and doctors to record patient vital signs (temperature, BP, heart rate, respiratory rate, oxygen saturation, weight, height, BMI).
**FR-4.3**: The system shall allow doctors to document SOAP notes (Subjective, Objective, Assessment, Plan).
**FR-4.4**: The system shall allow doctors to add ICD-10 diagnosis codes to encounters.
**FR-4.5**: The system shall allow doctors to sign off encounters with timestamps.
**FR-4.6**: The system shall implement visit status routing (TRIAGE → DOCTOR_CONSULT → LAB_PENDING → LAB_READY → BILLING → COMPLETED).
**FR-4.7**: The system shall display complete patient medical history and previous encounters.
**FR-4.8**: The system shall allow users to attach files to encounters (documents, images).
**FR-4.9**: The system shall maintain audit trails for all clinical documentation changes.
**FR-4.10**: The system shall provide chief complaint tracking for encounters.

### FR-5: Prescription Management
**FR-5.1**: The system shall allow doctors to create prescriptions for patients.
**FR-5.2**: The system shall automatically check for patient allergies before adding medications.
**FR-5.3**: The system shall check for drug interactions between prescribed medications.
**FR-5.4**: The system shall allow doctors to add multiple medications to a single prescription.
**FR-5.5**: The system shall store detailed medication information (dosage, frequency, duration, route, instructions).
**FR-5.6**: The system shall allow pharmacists to dispense medications with batch tracking.
**FR-5.7**: The system shall maintain complete prescription history for patients.
**FR-5.8**: The system shall allow doctors to view current and past prescriptions.
**FR-5.9**: The system shall prevent dispensing of medications that patients are allergic to.
**FR-5.10**: The system shall track prescription status (PENDING → PARTIALLY_DISPENSED → DISPENSED).

### FR-6: Laboratory Management
**FR-6.1**: The system shall allow doctors to order laboratory tests for patients.
**FR-6.2**: The system shall maintain a catalogue of available laboratory tests with pricing.
**FR-6.3**: The system shall allow lab technicians to view pending lab orders with patient context.
**FR-6.4**: The system shall allow lab technicians to accept or reject lab assignments.
**FR-6.5**: The system shall allow lab technicians to enter test results with normal/abnormal flagging (N, H, L).
**FR-6.6**: The system shall automatically add lab fees to encounter when lab order is created.
**FR-6.7**: The system shall automatically transition patient status to LAB_PENDING when lab order is created.
**FR-6.8**: The system shall automatically transition patient status to LAB_READY when lab results are entered.
**FR-6.9**: The system shall automatically transition patient status to BILLING when lab order is completed.
**FR-6.10**: The system shall allow lab technicians to view patient demographics and chief complaint.
**FR-6.11**: The system shall support lab order priority levels (ROUTINE, URGENT, STAT).
**FR-6.12**: The system shall allow doctors to view lab results with reference ranges.
**FR-6.13**: The system shall maintain complete lab history for patients.
**FR-6.14**: The system shall allow administrators to manage lab test catalogue (create, update, delete).

### FR-7: Billing and Payments
**FR-7.1**: The system shall allow receptionists to generate invoices from encounter fees.
**FR-7.2**: The system shall automatically include consultation fees, lab tests, and services in invoices.
**FR-7.3**: The system shall allow receptionists to mark invoices as paid.
**FR-7.4**: The system shall automatically discharge patients when invoices are marked as paid.
**FR-7.5**: The system shall support multiple payment methods (Cash, Card, Mobile Money, Bank Transfer).
**FR-7.6**: The system shall track invoice status (DRAFT → ISSUED → PAID).
**FR-7.7**: The system shall allow receptionists to manually discharge patients.
**FR-7.8**: The system shall update encounter status to COMPLETED when patient is discharged.
**FR-7.9**: The system shall allow administrators to configure fee structures for services.
**FR-7.10**: The system shall display paid patients with visual indicators in the waiting room.
**FR-7.11**: The system shall maintain complete payment history for patients.
**FR-7.12**: The system shall allow receptionists to view all invoices and their details.

### FR-8: Reporting and Analytics
**FR-8.1**: The system shall generate daily revenue reports showing total billed, collected, and pending amounts.
**FR-8.2**: The system shall generate monthly revenue reports with breakdown by service type.
**FR-8.3**: The system shall provide operational statistics (new patients, appointments, encounters, lab orders, prescriptions).
**FR-8.4**: The system shall generate doctor performance reports showing appointment completion rates and revenue.
**FR-8.5**: The system shall provide financial summaries with payment method breakdowns.
**FR-8.6**: The system shall allow users to export report data to CSV format.
**FR-8.7**: The system shall allow users to filter reports by date range.
**FR-8.8**: The system shall provide patient visit history exports.
**FR-8.9**: The system shall display visual charts and graphs for key metrics.
**FR-8.10**: The system shall allow administrators to schedule automated report generation.

### FR-9: Notification System
**FR-9.1**: The system shall send notifications for appointment scheduling and reminders.
**FR-9.2**: The system shall send notifications when lab results are ready.
**FR-9.3**: The system shall send notifications when prescriptions are dispensed.
**FR-9.4**: The system shall send notifications for appointment status changes.
**FR-9.5**: The system shall allow users to mark notifications as read.
**FR-9.6**: The system shall display notification history for users.
**FR-9.7**: The system shall allow users to configure notification preferences.
**FR-9.8**: The system shall send notifications for emergency access grants.
**FR-9.9**: The system shall implement notification expiration.
**FR-9.10**: The system shall support both user-specific and system-wide notifications.

### FR-10: Security and Compliance
**FR-10.1**: The system shall implement JWT-based authentication for API access.
**FR-10.2**: The system shall enforce role-based access control for all system functions.
**FR-10.3**: The system shall log all sensitive operations in an audit trail.
**FR-10.4**: The system shall implement input validation using schema validation.
**FR-10.5**: The system shall protect against SQL injection using parameterized queries.
**FR-10.6**: The system shall implement rate limiting to prevent API abuse.
**FR-10.7**: The system shall use HTTPS for all communications in production.
**FR-10.8**: The system shall implement CORS policies for cross-origin requests.
**FR-10.9**: The system shall implement security headers (Helmet.js).
**FR-10.10**: The system shall provide emergency access mechanisms for patient records.

### FR-11: System Administration
**FR-11.1**: The system shall allow administrators to configure system settings.
**FR-11.2**: The system shall allow administrators to manage doctor availability schedules.
**FR-11.3**: The system shall allow administrators to manage the lab test catalogue.
**FR-11.4**: The system shall allow administrators to manage service catalogue and pricing.
**FR-11.5**: The system shall provide database backup and restore functionality.
**FR-11.6**: The system shall monitor system performance and resource usage.
**FR-11.7**: The system shall provide error logging and monitoring.
**FR-11.8**: The system shall allow administrators to view system health status.
**FR-11.9**: The system shall implement automated database maintenance tasks.
**FR-11.10**: The system shall provide configuration for third-party integrations.

### FR-12: Integration Requirements
**FR-12.1**: The system shall support integration with external email services for notifications.
**FR-12.2**: The system shall support integration with SMS services for appointment reminders.
**FR-12.3**: The system shall support integration with payment gateways for online payments.
**FR-12.4**: The system shall support integration with electronic health record systems.
**FR-12.5**: The system shall support integration with laboratory information systems.
**FR-12.6**: The system shall provide API endpoints for third-party integrations.
**FR-12.7**: The system shall support webhook notifications for external systems.
**FR-12.8**: The system shall support data import/export functionality.
**FR-12.9**: The system shall support integration with insurance claim systems.
**FR-12.10**: The system shall provide API documentation for developers.

---

## Non-Functional Requirements

### NFR-1: Performance Requirements
**NFR-1.1**: The system shall respond to user actions within 2 seconds for 95% of requests.
**NFR-1.2**: The system shall support 100 concurrent users without significant performance degradation.
**NFR-1.3**: The system shall load dashboard pages within 3 seconds.
**NFR-1.4**: The system shall complete database queries within 500ms for standard operations.
**NFR-1.5**: The system shall handle 1000 API requests per minute without performance issues.
**NFR-1.6**: The system shall implement database indexing for optimal query performance.
**NFR-1.7**: The system shall implement caching for frequently accessed data.
**NFR-1.8**: The system shall optimize image and file loading for performance.
**NFR-1.9**: The system shall implement lazy loading for large datasets.
**NFR-1.10**: The system shall provide performance monitoring and alerting.

### NFR-2: Scalability Requirements
**NFR-2.1**: The system shall be designed to scale horizontally using load balancers.
**NFR-2.2**: The system shall support database scaling through read replicas.
**NFR-2.3**: The system shall implement connection pooling for database efficiency.
**NFR-2.4**: The system shall support cloud deployment with auto-scaling capabilities.
**NFR-2.5**: The system shall handle increasing data volumes without performance degradation.
**NFR-2.6**: The system shall implement microservices architecture for future scalability.
**NFR-2.7**: The system shall support CDN integration for static assets.
**NFR-2.8**: The system shall implement session state management for distributed systems.
**NFR-2.9**: The system shall support database sharding if needed.
**NFR-2.10**: The system shall provide capacity planning tools.

### NFR-3: Reliability Requirements
**NFR-3.1**: The system shall have 99.9% uptime during business hours.
**NFR-3.2**: The system shall implement automatic failover for critical components.
**NFR-3.3**: The system shall have disaster recovery procedures in place.
**NFR-3.4**: The system shall implement regular automated database backups.
**NFR-3.5**: The system shall have redundant infrastructure for critical services.
**NFR-3.6**: The system shall implement error handling and recovery mechanisms.
**NFR-3.7**: The system shall have data replication across multiple availability zones.
**NFR-3.8**: The system shall implement health checks and monitoring.
**NFR-3.9**: The system shall have incident response procedures documented.
**NFR-3.10**: The system shall maintain data consistency across distributed components.

### NFR-4: Security Requirements
**NFR-4.1**: The system shall implement strong password policies (minimum 8 characters, mixed case, numbers, special characters).
**NFR-4.2**: The system shall use bcrypt with minimum 12 salt rounds for password hashing.
**NFR-4.3**: The system shall implement JWT tokens with 15-minute expiration for access tokens.
**NFR-4.4**: The system shall use HTTPS with TLS 1.2+ for all communications.
**NFR-4.5**: The system shall implement input validation and sanitization to prevent XSS attacks.
**NFR-4.6**: The system shall use parameterized queries to prevent SQL injection.
**NFR-4.7**: The system shall implement rate limiting (100 requests per 15 minutes per user).
**NFR-4.8**: The system shall implement CORS policies to restrict cross-origin access.
**NFR-4.9**: The system shall implement security headers (CSP, X-Frame-Options, X-XSS-Protection).
**NFR-4.10**: The system shall conduct regular security audits and penetration testing.

### NFR-5: Usability Requirements
**NFR-5.1**: The system shall have an intuitive user interface with consistent design patterns.
**NFR-5.2**: The system shall be accessible to users with disabilities (WCAG 2.1 AA compliance).
**NFR-5.3**: The system shall provide clear error messages and guidance for users.
**NFR-5.4**: The system shall support keyboard navigation for all functions.
**NFR-5.5**: The system shall provide responsive design for desktop, tablet, and mobile devices.
**NFR-5.6**: The system shall load pages within 3 seconds on standard internet connections.
**NFR-5.7**: The system shall provide contextual help and tooltips for complex functions.
**NFR-5.8**: The system shall support multiple languages for international users.
**NFR-5.9**: The system shall provide consistent navigation across all pages.
**NFR-5.10**: The system shall be tested with real users for usability validation.

### NFR-6: Maintainability Requirements
**NFR-6.1**: The system shall be built using modern, well-supported frameworks and libraries.
**NFR-6.2**: The system shall have comprehensive code documentation.
**NFR-6.3**: The system shall follow coding standards and best practices.
**NFR-6.4**: The system shall implement automated testing with minimum 80% code coverage.
**NFR-6.5**: The system shall have automated deployment pipelines.
**NFR-6.6**: The system shall implement logging for troubleshooting and monitoring.
**NFR-6.7**: The system shall have modular architecture for easy maintenance.
**NFR-6.8**: The system shall use dependency management with version pinning.
**NFR-6.9**: The system shall have database migration scripts for schema changes.
**NFR-6.10**: The system shall provide API documentation for developers.

### NFR-7: Compatibility Requirements
**NFR-7.1**: The system shall support modern web browsers (Chrome, Firefox, Safari, Edge) with versions released in the last 2 years.
**NFR-7.2**: The system shall be compatible with mobile devices (iOS 12+, Android 8+).
**NFR-7.3**: The system shall support PostgreSQL 14+ for the database.
**NFR-7.4**: The system shall be compatible with Node.js 18+ for the backend.
**NFR-7.5**: The system shall support Docker containerization for deployment.
**NFR-7.6**: The system shall be compatible with cloud platforms (AWS, Azure, GCP).
**NFR-7.7**: The system shall support integration with common authentication providers (OAuth, SAML).
**NFR-7.8**: The system shall be compatible with common payment gateways (Stripe, PayPal).
**NFR-7.9**: The system shall support standard file formats (PDF, CSV, JSON).
**NFR-7.10**: The system shall be compatible with HL7 FHIR standards for healthcare data exchange.

### NFR-8: Data Integrity Requirements
**NFR-8.1**: The system shall maintain referential integrity through foreign key constraints.
**NFR-8.2**: The system shall implement database transactions for multi-step operations.
**NFR-8.3**: The system shall validate all input data before database storage.
**NFR-8.4**: The system shall implement soft delete for critical data instead of permanent deletion.
**NFR-8.5**: The system shall maintain audit trails for all data modifications.
**NFR-8.6**: The system shall implement data validation rules at the database level.
**NFR-8.7**: The system shall prevent data anomalies through proper normalization.
**NFR-8.8**: The system shall implement data encryption for sensitive fields.
**NFR-8.9**: The system shall maintain data consistency across distributed systems.
**NFR-8.10**: The system shall implement regular data integrity checks.

### NFR-9: Availability Requirements
**NFR-9.1**: The system shall be available 24/7 except for scheduled maintenance windows.
**NFR-9.2**: The system shall have maximum 4 hours of scheduled downtime per month.
**NFR-9.3**: The system shall implement graceful degradation during high load periods.
**NFR-9.4**: The system shall have backup systems that can be activated within 1 hour.
**NFR-9.5**: The system shall implement load balancing to distribute traffic.
**NFR-9.6**: The system shall have automated failover for critical services.
**NFR-9.7**: The system shall provide status pages for system availability information.
**NFR-9.8**: The system shall implement circuit breakers for external service calls.
**NFR-9.9**: The system shall have monitoring and alerting for availability issues.
**NFR-9.10**: The system shall implement retry logic for transient failures.

### NFR-10: Compliance Requirements
**NFR-10.1**: The system shall comply with HIPAA regulations for patient data protection.
**NFR-10.2**: The system shall comply with GDPR for data protection and privacy.
**NFR-10.3**: The system shall maintain patient data confidentiality and integrity.
**NFR-10.4**: The system shall provide patients with access to their medical records.
**NFR-10.5**: The system shall implement data retention policies in compliance with regulations.
**NFR-10.6**: The system shall provide audit trails for all patient data access.
**NFR-10.7**: The system shall implement data breach notification procedures.
**NFR-10.8**: The system shall comply with local healthcare regulations and standards.
**NFR-10.9**: The system shall maintain proper documentation for compliance audits.
**NFR-10.10**: The system shall implement business associate agreements with third-party services.

### NFR-11: Capacity Requirements
**NFR-11.1**: The system shall support storage for 1TB of patient data.
**NFR-11.2**: The system shall support 100,000 patient records.
**NFR-11.3**: The system shall support 1,000 concurrent users.
**NFR-11.4**: The system shall support 10,000 daily transactions.
**NFR-11.5**: The system shall support 1,000 daily appointments.
**NFR-11.6**: The system shall support 500 daily encounters.
**NFR-11.7**: The system shall support 1,000 daily prescriptions.
**NFR-11.8**: The system shall support 500 daily lab orders.
**NFR-11.9**: The system shall support 1,000 daily invoices.
**NFR-11.10**: The system shall have capacity for 5x growth without major architecture changes.

### NFR-12: Testing Requirements
**NFR-12.1**: The system shall have unit tests for all business logic with minimum 80% coverage.
**NFR-12.2**: The system shall have integration tests for all API endpoints.
**NFR-12.3**: The system shall have end-to-end tests for critical user workflows.
**NFR-12.4**: The system shall have performance tests for critical operations.
**NFR-12.5**: The system shall have security tests for authentication and authorization.
**NFR-12.6**: The system shall have load tests for capacity validation.
**NFR-12.7**: The system shall have compatibility tests across supported browsers.
**NFR-12.8**: The system shall have database migration tests.
**NFR-12.9**: The system shall have automated regression testing in CI/CD pipeline.
**NFR-12.10**: The system shall have user acceptance testing before major releases.

---

## Conclusion

This system specification provides a comprehensive overview of the Clinic Management System, covering all actors, database structure, functional requirements, and non-functional requirements. The system is designed to be scalable, secure, and compliant with healthcare regulations while providing an intuitive user experience for all stakeholders.

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Approved for Implementation