# Functional Requirements - Current System (Modified for MCMS Alignment)

This document contains the modified functional requirements for the current Clinic Management System to align with MCMS standards.

---

## FR-1: User Management and Authentication

**FR-1.1**: The system shall allow administrators to create, update, and deactivate user accounts.

**FR-1.2**: The system shall assign appropriate roles to users based on their job functions, including Administrator, Doctor, Nurse, Receptionist, and Lab Technician.

**FR-1.3**: The system shall enforce role-based access control for all system features.

**FR-1.4**: The system shall require users to authenticate using an email address and password to access the system.

**FR-1.5**: The system shall implement secure password storage using bcrypt hashing with a minimum of 12 salt rounds.

**FR-1.6**: The system shall provide password reset functionality for users who forget their credentials.

**FR-1.7**: The system shall log all user login attempts, including both successful and failed attempts, for security monitoring.

**FR-1.8**: The system shall allow administrators to view user activity logs and access patterns.

**FR-1.9**: The system shall implement session management with automatic session timeout after 15 minutes of inactivity.

**FR-1.10**: The system shall support multi-factor authentication for sensitive operations.

---

## FR-2: Patient Management

**FR-2.1**: The system shall allow receptionists to register new patients with complete demographic information, including name, date of birth, gender, contact details, and address.

**FR-2.2**: The system shall automatically generate unique Medical Record Numbers (MRN) using the format MRN-YYYY-XXXXXXXX.

**FR-2.3**: The system shall detect duplicate patients based on name, date of birth, phone number, email address, and national ID to prevent duplicate records.

**FR-2.4**: The system shall allow authorized users to search for patients by MRN, name, phone number, email address, or national ID using partial matching.

**FR-2.5**: The system shall display comprehensive patient profiles containing demographic information, contact information, medical history, allergies, and emergency contacts.

**FR-2.6**: The system shall allow authorized users to update patient information with appropriate validation and audit trails.

**FR-2.7**: The system shall implement patient archiving through soft deletion rather than permanent deletion to maintain data integrity.

**FR-2.8**: The system shall maintain a unified timeline of all patient activities, including encounters, laboratory tests, and payments.

**FR-2.9**: The system shall allow users to record patient allergies with severity levels of Mild, Moderate, or Severe, together with additional notes.

**FR-2.10**: The system shall provide emergency contact information and allow emergency access grants for urgent situations.

---

## FR-3: Clinical Documentation (EMR)

**FR-3.1**: The system shall allow doctors to create clinical encounters for walk-in visits.

**FR-3.2**: The system shall allow nurses and doctors to record vital signs, including temperature, blood pressure, heart rate, respiratory rate, oxygen saturation, weight, height, and BMI.

**FR-3.3**: The system shall allow doctors to document SOAP notes, consisting of Subjective, Objective, Assessment, and Plan information, using structured fields and free-text options.

**FR-3.4**: The system shall allow doctors to add ICD-10 diagnosis codes to encounters with code validation and description lookup.

**FR-3.5**: The system shall allow doctors to sign off encounters using timestamps and digital signatures for legal compliance.

**FR-3.6**: The system shall implement visit status routing through hospital departments using the following workflow: TRIAGE → DOCTOR_CONSULT → LAB_PENDING → LAB_READY → BILLING → COMPLETED.

**FR-3.7**: The system shall display complete medical history, including previous encounters, diagnoses, and laboratory results.

**FR-3.8**: The system shall allow users to attach files to encounters, including documents, images, and test results.

**FR-3.9**: The system shall maintain audit trails for all changes to clinical documentation, including user attribution and timestamps.

**FR-3.10**: The system shall provide chief complaint tracking and allow prioritization based on urgency.

---

## FR-4: Laboratory Management

**FR-4.1**: The system shall allow doctors to order laboratory tests during clinical encounters.

**FR-4.2**: The system shall maintain a comprehensive catalogue of available laboratory tests, including pricing, reference ranges, and sample requirements.

**FR-4.3**: The system shall allow laboratory technicians to view pending laboratory orders organized according to priority and urgency.

**FR-4.4**: The system shall allow laboratory technicians to enter test results with automatic normal or abnormal flagging based on reference ranges.

**FR-4.5**: The system shall automatically notify doctors when laboratory results are ready for review.

**FR-4.6**: The system shall allow doctors to view laboratory results together with reference ranges, trend analysis, and comparisons with previous results.

**FR-4.7**: The system shall maintain complete laboratory history, including all tests ordered and their corresponding results.

**FR-4.8**: The system shall allow users to filter laboratory tests by category, including Hematology, Biochemistry, Microbiology, and other categories.

**FR-4.9**: The system shall track laboratory order status through the workflow ORDERED → IN_PROGRESS → COMPLETED, with automated routing.

**FR-4.10**: The system shall provide quality control indicators and allow the review of critical laboratory results.

---

## FR-5: Billing and Payments

**FR-5.1**: The system shall automatically generate invoices based on services rendered, including consultations, laboratory tests, and procedures.

**FR-5.2**: The system shall include consultation fees, laboratory test charges, and procedure fees in invoices.

**FR-5.3**: The system shall allow receptionists to apply discounts with mandatory reason tracking and approval workflows.

**FR-5.4**: The system shall automatically calculate taxes on invoice totals based on configurable tax rates.

**FR-5.5**: The system shall support multiple payment methods, including Cash, Credit/Debit Cards, Mobile Money, and Bank Transfers.

**FR-5.6**: The system shall track invoice status through the workflow DRAFT → ISSUED → PARTIALLY_PAID → PAID, with automatic status updates.

**FR-5.7**: The system shall automatically complete visits when invoices are fully paid and update the corresponding visit status.

**FR-5.8**: The system shall allow receptionists to void invoices with mandatory reason tracking and audit trails.

**FR-5.9**: The system shall generate payment receipts containing a detailed breakdown of charges and payments for record keeping.

**FR-5.10**: The system shall maintain complete payment history and provide aging reports for accounts receivable.

---

## FR-6: Reporting and Analytics

**FR-6.1**: The system shall generate daily revenue reports showing total billed, collected, and pending amounts.

**FR-6.2**: The system shall generate monthly revenue reports with breakdowns by service type and payment method.

**FR-6.3**: The system shall provide operational statistics, including encounters and laboratory orders.

**FR-6.4**: The system shall generate doctor performance reports showing encounter completion rates and revenue generation.

**FR-6.5**: The system shall provide financial summaries containing payment method breakdowns, discount analysis, and profit margins.

**FR-6.6**: The system shall allow users to export report data in CSV, PDF, and Excel formats for further analysis.

**FR-6.7**: The system shall allow users to filter reports by date range, department, doctor, and other relevant parameters.

**FR-6.8**: The system shall provide visit history exports for regulatory reporting and analysis.

**FR-6.9**: The system shall display visual charts and graphs for key metrics, including revenue trends and resource utilization.

**FR-6.10**: The system shall allow administrators to schedule automated report generation and email delivery.

---

## FR-7: Notification System

**FR-7.1**: The system shall send notifications when laboratory results are ready for doctor review.

**FR-7.2**: The system shall send notifications for urgent updates.

**FR-7.3**: The system shall allow users to mark notifications as read and manage their notification preferences.

**FR-7.4**: The system shall display notification history for users with filtering and search capabilities.

**FR-7.5**: The system shall allow users to configure notification preferences, including email, SMS, and in-app notifications.

**FR-7.6**: The system shall send notifications for critical security events.

**FR-7.7**: The system shall implement notification expiration and automatic cleanup of old notifications.

**FR-7.8**: The system shall support both user-specific notifications and system-wide announcements.

---

## FR-8: File Upload and Attachments (New)

**FR-8.1**: The system shall allow users to upload and attach files to encounters including documents, images, and test results.

**FR-8.2**: The system shall implement file security validation and storage management for uploaded files.

**FR-8.3**: The system shall support file types including PDF, images (JPEG, PNG), and documents (DOC, DOCX).

---

## FR-9: HL7 FHIR Interoperability (New)

**FR-9.1**: The system shall be compatible with HL7 FHIR standards for healthcare data exchange with external systems.

**FR-9.2**: The system shall implement FHIR API endpoints for Patient, Encounter, and Observation resources.

**FR-9.3**: The system shall provide external system integration interfaces for EHR interoperability.

---

## Priority Implementation Order

### High Priority (Core Functionality)
1. FR-5.4: Tax calculation
2. FR-5.6: Invoice status alignment
3. FR-8: File upload and attachments

### Medium Priority (Enhanced Features)
4. FR-5.3: Discount approval workflows
5. FR-5.10: Aging reports
6. FR-4.8: Lab test categories
7. FR-7.5: Notification preferences
8. FR-6.6: PDF/Excel exports

### Low Priority (Advanced Features)
9. FR-1.9: Session timeout
10. FR-1.10: Multi-factor authentication
11. FR-6.10: Automated report scheduling
12. FR-9: HL7 FHIR interoperability

---

## Database Schema Changes Required

### New Tables/Fields
- `LabTest.category` (Enum: HEMATOLOGY, BIOCHEMISTRY, MICROBIOLOGY, etc.)
- `Invoice.taxRate` (Decimal)
- `UserNotificationPreference` (New table)
- `ScheduledReport` (New table)

### Modified Tables
- `Invoice.status` enum values (change OVERDUE to VOID, add REFUNDED)
- `LabTest` add category field
- `LabResult` add QC fields

---

## Tech Stack Additions Required

### Backend
- Multer for file uploads
- PDF generation library (PDFKit, jsPDF)
- Excel generation library (exceljs)
- Email service integration (SendGrid, Nodemailer)
- SMS service integration (Twilio)
- FHIR library (fhir.js)

### Frontend
- File upload component library
- PDF viewer
- Excel viewer
- Notification preference UI

---

## Summary

**Total Functional Requirements**: 52 (10 FR-1, 10 FR-2, 10 FR-3, 10 FR-4, 10 FR-5, 10 FR-6, 8 FR-7, 3 FR-8, 3 FR-9)

**Scope**: Prescription management, multi-language support, and payment gateway integration are out of scope for this system and have been removed from functional requirements. Payment processing is handled manually by receptionists.

**High Impact Changes**:
- Tax calculation implementation
- Invoice status realignment
- File upload functionality
- Multi-channel notifications

**Estimated Implementation Effort**: 3-4 months for full alignment
