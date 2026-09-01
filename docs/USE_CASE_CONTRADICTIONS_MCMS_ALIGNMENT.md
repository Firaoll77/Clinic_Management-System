# Use Cases - Current System (Modified for MCMS Alignment)

This document contains the use cases for the current Clinic Management System aligned with MCMS standards.

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
- Lab order management
- Encounter sign-off
- Patient follow-up coordination

**Use Cases**:
- UC-DOCTOR-01: View patient schedule
- UC-DOCTOR-02: Conduct patient consultation
- UC-DOCTOR-03: Record patient vitals
- UC-DOCTOR-04: Document SOAP notes
- UC-DOCTOR-05: Add diagnosis codes
- UC-DOCTOR-06: Order laboratory tests
- UC-DOCTOR-07: Sign off encounters
- UC-DOCTOR-08: Review lab results

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

#### 6. Patient
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

#### 7. System (Automated Processes)
**Role**: Background automation and notifications
**Responsibilities**:
- Automated appointment reminders
- Lab result notifications
- System backups
- Data synchronization
- Security monitoring
- Performance optimization

**Use Cases**:
- UC-SYSTEM-01: Send appointment reminders
- UC-SYSTEM-02: Notify lab results
- UC-SYSTEM-03: Automated backups
- UC-SYSTEM-04: Data synchronization
- UC-SYSTEM-05: Security monitoring

---

## Detailed Use Case Flows

### UC-ADMIN-01: MANAGE USER ACCOUNTS
**Actor**: System Administrator
**Description**: Create, update, deactivate, and manage user accounts
**Preconditions**: Administrator must be logged in with appropriate permissions
**Main Flow**:
1. Administrator navigates to User Management section
2. Administrator clicks "Add New User"
3. Administrator enters user details (name, email, role, department)
4. System validates email uniqueness and required fields
5. System generates temporary password
6. System sends account creation email to new user
7. User account is created and activated
**Alternative Flows**:
- If email already exists, system displays error and suggests alternatives
- If role selection is invalid, system provides guidance on appropriate roles
**Postconditions**: User account is created and user can log in with temporary password

### UC-RECEP-01: REGISTER NEW PATIENT
**Actor**: Receptionist
**Description**: Register a new patient in the system with automatic MRN generation
**Preconditions**: Receptionist must be logged in with appropriate permissions
**Main Flow**:
1. Receptionist navigates to Patient Registration page
2. Receptionist enters patient demographic information (name, DOB, gender, contact details)
3. Receptionist enters contact information and emergency contacts
4. Receptionist adds any known allergies or medical conditions
5. System validates required fields and data formats
6. System checks for duplicate patients based on name, DOB, phone, and national ID
7. System generates unique MRN in format MRN-YYYY-XXXXXXXX
8. System creates patient record and displays confirmation
**Alternative Flows**:
- If duplicate patient detected, system displays warning and allows linking to existing record
- If validation fails, system highlights errors and requires correction
**Postconditions**: Patient is registered in system with unique MRN and can be scheduled for appointments

### UC-RECEP-02: PROCESS PAYMENTS
**Actor**: Receptionist
**Description**: Generate invoices, process payments, and manage billing
**Preconditions**: Receptionist must be logged in, encounter must be completed
**Main Flow**:
1. Receptionist views encounters ready for billing
2. System auto-generates draft invoice with applicable charges
3. Receptionist reviews invoice items and charges
4. Receptionist adds any additional charges or adjustments
5. Receptionist applies discount if applicable with reason
6. System calculates final total including taxes
7. Receptionist issues invoice to patient
8. Patient makes payment using selected method
9. Receptionist records payment details
10. System updates invoice status to PAID and completes visit
**Alternative Flows**:
- If payment is partial, system updates status to PARTIALLY_PAID and tracks balance
- If payment fails, system allows retry with different payment method
**Postconditions**: Payment is recorded, invoice is updated, and visit is marked as completed

### UC-NURSE-01: RECORD VITAL SIGNS
**Actor**: Nurse
**Description**: The nurse records the patient's vital signs during triage and clinical encounters
**Preconditions**: The nurse must be logged in, and the patient must be checked in
**Main Flow**:
1. The nurse views the list of patients awaiting triage or vital signs
2. The nurse selects a patient from the list
3. The nurse records the patient's vital signs, including temperature, blood pressure, heart rate, respiratory rate, oxygen saturation, weight, and height
4. The system automatically calculates the patient's Body Mass Index (BMI) based on the recorded weight and height
5. The nurse adds any additional notes or observations
6. The system saves the recorded vital signs and updates the patient's medical record
7. The system identifies and flags abnormal vital signs based on the configured reference ranges
8. The system routes the patient to the appropriate department based on the triage assessment
**Alternative Flows**:
- If the patient's vital signs are critically abnormal, the system sends an immediate alert to the doctor
- If the patient has recorded allergies, the system displays the corresponding allergy warnings
**Postconditions**: The patient's vital signs are successfully recorded, the patient is triaged, and the patient is routed to the appropriate department

### UC-DOCTOR-01: CONDUCT PATIENT CONSULTATION
**Actor**: Doctor
**Description**: Examine patient, record findings, and create treatment plan
**Preconditions**: Doctor must be logged in, patient must be checked in
**Main Flow**:
1. Doctor views list of checked-in patients
2. Doctor selects patient from list
3. Doctor reviews patient medical history and previous encounters
4. Doctor records or updates patient vital signs
5. Doctor documents SOAP notes (Subjective, Objective, Assessment, Plan)
6. Doctor adds ICD-10 diagnosis codes if applicable
7. Doctor orders laboratory tests if needed
8. Doctor signs off encounter
9. System updates visit status and routes to next department
**Alternative Flows**:
- If patient has critical allergies, system displays warnings
- If lab tests are ordered, system routes patient to laboratory department
**Postconditions**: Encounter is documented and patient is routed appropriately

### UC-LAB-01: PROCESS LABORATORY ORDERS
**Actor**: Laboratory Technician
**Description**: Receive lab orders, process samples, and enter results
**Preconditions**: Lab technician must be logged in, lab orders must be assigned
**Main Flow**:
1. Lab technician views pending lab orders with patient context
2. Lab technician accepts or rejects lab assignment
3. Lab technician verifies patient information and sample details
4. Lab technician processes sample according to test requirements
5. Lab technician enters test results with values and units
6. System automatically flags results as normal or abnormal based on reference ranges
7. Lab technician adds any notes or comments if needed
8. Lab technician completes lab order
9. System notifies doctor that results are ready
10. System updates visit status to LAB_READY
**Alternative Flows**:
- If sample quality is inadequate, lab technician can request new sample
- If critical results are found, system sends immediate notification to doctor
**Postconditions**: Lab results are recorded, doctor is notified, and patient can proceed to next step
