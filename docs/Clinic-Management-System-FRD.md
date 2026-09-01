# Functional Requirements Document (FRD)
## Clinic Management System (CMS)

**Prepared for:** Hundaf Digital Solution — Technical Evaluation
**Version:** 1.0
**Date:** 11 August 2026
**Timeline:** 15 days
**Stack:** Next.js (frontend) · Node.js/Express (backend API) · PostgreSQL (database) · Docker (containerization) · GitHub Actions (CI/CD)

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for a Clinic Management System (CMS) that digitizes patient registration, appointment scheduling, consultations, prescriptions, billing, pharmacy/inventory, and reporting for a small-to-medium outpatient clinic.

### 1.2 Scope
**In scope:** Patient records, appointments, doctor consultations & EMR notes, prescriptions, lab test requests/results, billing & invoicing, pharmacy inventory, staff/user management with role-based access, dashboards and reports, audit logging.

**Note:** This is a staff-only system. Patients do not login; all interactions are handled by clinic staff (receptionists, doctors, nurses, etc.)

**Out of scope (v1):** Insurance claim clearing-house integration, inpatient/ward management, telemedicine video calls, mobile native apps, multi-clinic franchising (single-tenant only), patient self-service portal.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| EMR | Electronic Medical Record |
| MRN | Medical Record Number — unique patient identifier |
| Encounter | A single clinical visit/consultation |
| RBAC | Role-Based Access Control |
| SOAP | Subjective, Objective, Assessment, Plan — clinical note format |

---

## 2. System Overview

### 2.1 Architecture
```text
                    ┌───────────────────────────┐
   Browser  ───────▶│  Next.js App (SSR + CSR)  │
                    │  App Router, React Query  │
                    └─────────────┬─────────────┘
                                  │ HTTPS / REST (JSON)
                    ┌─────────────▼─────────────┐
                    │  Node.js API (Express)    │
                    │  JWT auth · RBAC · Zod    │
                    │  Prisma ORM               │
                    └─────────────┬─────────────┘
                                  │ TCP 5432
                    ┌─────────────▼─────────────┐
                    │  PostgreSQL 16            │
                    └───────────────────────────┘

  All three run as Docker containers, orchestrated by docker-compose
  (dev) and deployed via GitHub Actions to the target host/registry.
```

### 2.2 Container Topology
| Container | Image base | Port | Notes |
|---|---|---|---|
| `web` | node:20-alpine (multi-stage, `next build`) | 3000 | Next.js standalone output |
| `api` | node:20-alpine (multi-stage, tsc build) | 4000 | Express + Prisma, runs migrations on boot |
| `db` | postgres:16-alpine | 5432 | Named volume `pgdata` for persistence |
| `nginx` (optional) | nginx:alpine | 80/443 | Reverse proxy + TLS termination |

---

## 3. User Roles & Permissions

| Role | Description | Key permissions |
|---|---|---|
| **Admin** | Clinic administrator/owner | Full access: user CRUD, role assignment, service & price setup, all reports, audit log |
| **Receptionist** | Front desk & Finance | Register/search patients, walk-in check-in, nurse assignment, generate invoices, collect payments, financial reports, prescription dispensing |
| **Doctor** | Physician | View own schedule & assigned patients, record consultations (SOAP), issue prescriptions, order lab tests, view patient history |
| **Nurse** | Clinical support | Record vitals & triage, view assigned encounters, update nursing notes |
| **Lab Technician** | Laboratory | View lab orders, upload/enter results, mark orders complete |

**Permission model:** RBAC enforced at the API layer via middleware (`requireRole([...])`) and mirrored in the UI (route guards + conditional rendering). Row-level ownership checks apply (e.g. a doctor may only edit encounters they authored).

---

## 4. Core Modules & Functional Requirements

### 4.1 Authentication & Account Management
- FR-1.1 Users log in with email + password; passwords hashed with bcrypt (cost ≥ 12).
- FR-1.2 JWT access token (15 min) + rotating refresh token (7 days, httpOnly cookie).
- FR-1.3 Admin creates staff accounts and assigns exactly one primary role.
- FR-1.4 Password reset via emailed single-use token (30 min expiry).
- FR-1.5 Account lockout after 5 consecutive failed logins within 15 minutes.
- FR-1.6 Every login, logout and privileged action written to the audit log.

### 4.2 Patient Management
- FR-2.1 Register a patient with: full name, DOB, gender, phone, email, address, national ID, emergency contact, blood group, allergies, chronic conditions.
- FR-2.2 System auto-generates a unique MRN (format `MRN-YYYY-NNNNNN`).
- FR-2.3 Search patients by name, phone, MRN or national ID with pagination.
- FR-2.4 Edit demographics; all changes versioned in the audit log.
- FR-2.5 Patient profile page shows timeline: appointments, encounters, prescriptions, lab results, invoices.
- FR-2.6 Soft-delete (archive) patients; never hard-delete clinical data.

### 4.3 Walk-in & Triage System
- FR-3.1 Walk-in patient registration without pre-scheduled appointments.
- FR-3.2 Automatic triage routing: patients automatically assigned TRIAGE status on registration.
- FR-3.3 Optional nurse assignment: receptionist can assign specific nurse to patient encounter.
- FR-3.4 Visit status workflow: `TRIAGE → DOCTOR_CONSULT → LAB_PENDING → LAB_READY → BILLING → COMPLETED`.
- FR-3.5 Real-time patient status tracking across clinical stations.
- FR-3.6 Activity logging: comprehensive audit trail for patient movement through system.
- FR-3.7 Encounter-centric workflow: patients tracked via encounters rather than appointments.

### 4.4 Appointment Scheduling (Optional)
- FR-4.1 Define per-doctor availability (weekday, start/end time, slot duration, breaks).
- FR-4.2 Book an appointment against an available slot; system rejects double-booking (DB unique constraint on `doctor_id + scheduled_at`).
- FR-4.3 Statuses: `SCHEDULED → CHECKED_IN → IN_PROGRESS → COMPLETED`, plus `CANCELLED` and `NO_SHOW`.
- FR-4.4 Reschedule and cancel with a reason; history retained.
- FR-4.5 Calendar (day/week) and list views, filterable by doctor, department, date range and status.
- FR-4.6 Email/SMS reminder 24 h before the appointment (queued job).

### 4.5 Consultation & EMR
- FR-5.1 Nurse records vitals: temperature, BP, pulse, respiratory rate, SpO₂, weight, height, auto-calculated BMI.
- FR-5.2 Nurse conducts triage assessment: chief complaint, current medications, allergies, medical history.
- FR-5.3 Doctor records a SOAP note per encounter: chief complaint, history, examination findings, diagnosis (ICD-10 code + text), treatment plan.
- FR-5.4 Attach files to an encounter (max 10 MB, PDF/JPG/PNG).
- FR-5.5 Encounters are immutable after sign-off; corrections are added as an addendum.
- FR-5.6 Full chronological patient history accessible to treating clinicians.

### 4.6 Prescriptions & Pharmacy
- FR-6.1 Doctor issues a prescription with one or more items: drug, dosage, frequency, duration, route, instructions.
- FR-6.2 Drug picker sourced from the pharmacy catalogue; free-text allowed with a warning.
- FR-6.3 Allergy warning banner when a prescribed drug matches a recorded patient allergy.
- FR-6.4 Pharmacist views pending prescriptions, dispenses items, and stock decrements atomically.
- FR-6.5 Inventory: item name, generic name, batch, expiry date, quantity, reorder level, unit price.
- FR-6.6 Low-stock and near-expiry (≤ 60 days) dashboard alerts.
- FR-6.7 Printable/downloadable PDF prescription with clinic letterhead.

### 4.7 Laboratory
- FR-7.1 Doctor orders one or more lab tests from a configurable catalogue.
- FR-7.2 Lab technician sees the order queue, enters results (value, unit, reference range, flag H/L/N) and marks them complete.
- FR-7.3 Result availability notifies the ordering doctor.
- FR-7.4 Results attach to the encounter and appear in the patient timeline.
- FR-7.5 Lab status workflow: `LAB_PENDING → LAB_READY` for doctor review.

### 4.8 Billing & Payments
- FR-8.1 Configurable service catalogue with prices (consultation, procedures, lab tests, drugs).
- FR-8.2 Invoice auto-drafted from encounter charges: services + lab + dispensed drugs.
- FR-8.3 Apply discounts (percent or fixed) with a reason; discounts above 20 % need Admin approval.
- FR-8.4 Record payments: cash, card, mobile money; support partial payments and track balance.
- FR-8.5 Invoice statuses: `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `VOID`, `REFUNDED`.
- FR-8.6 Printable PDF receipt with sequential invoice number.
- FR-8.7 Visit completion and checkout workflow for finalizing patient visits.

### 4.9 Reporting & Dashboards
- FR-9.1 Admin dashboard: today's patients, patients seen, revenue today/this month, low-stock count.
- FR-9.2 Receptionist dashboard: active patients by visit status, patient database, nurse assignment.
- FR-9.3 Nurse dashboard: triage queue, patient intake assessment.
- FR-9.4 Doctor dashboard: consultation queue, pending lab results, recent patients.
- FR-9.5 Reports (filter by date range, export CSV/PDF): revenue by service, patients by visit status, new vs returning patients, top diagnoses, drug consumption, outstanding balances.

### 4.10 Administration & Audit
- FR-10.1 Manage clinic profile, departments, rooms, service catalogue, lab catalogue.
- FR-10.2 Manage users, roles, activation/deactivation.
- FR-10.3 Immutable audit log: actor, action, entity type, entity id, before/after diff, IP, timestamp; searchable, Admin-only.
- FR-10.4 Activity logging for patient movement through clinical stations.

---

## 5. Use Cases

### UC-01 Register a New Patient
- **Actor:** Receptionist
- **Precondition:** Authenticated with the Receptionist or Admin role.
- **Main flow:** Open *Patients → Register* → search for duplicates by phone/national ID → fill the form (including National ID, Blood Group, Emergency Contact) → save → system assigns an MRN → system automatically creates TRIAGE encounter → patient appears in nurse's triage queue.
- **Alternate:** A potential duplicate is found → the system prompts to open the existing record instead.
- **Exception:** Validation errors are shown inline; nothing is persisted.
- **Postcondition:** A patient row exists with a unique MRN, a TRIAGE encounter is created, and an audit entry is written.

### UC-02 Walk-in Patient Check-in
- **Actor:** Receptionist
- **Precondition:** The patient exists (registered previously).
- **Main flow:** Search patient database → select patient → optionally assign a specific nurse → click "Send to Triage" → system creates TRIAGE encounter → patient appears in nurse's triage queue.
- **Alternate:** Patient not found → redirect to patient registration (UC-01).
- **Postcondition:** A TRIAGE encounter exists for the patient, and activity log records the check-in.

### UC-03 Nurse Triage Assessment
- **Actor:** Nurse
- **Precondition:** Patient has TRIAGE status.
- **Main flow:** Open triage queue → select patient → record vitals (temperature, BP, pulse, SpO2, weight, height) → conduct intake assessment (chief complaint, medications, allergies, medical history) → complete triage → patient status changes to DOCTOR_CONSULT → patient appears in doctor's consultation queue.
- **Exception:** Vitals incomplete → system prompts to complete required fields.
- **Postcondition:** Vitals and intake notes are recorded, patient status updated to DOCTOR_CONSULT, activity log records triage completion.

### UC-04 Doctor Consultation
- **Actor:** Doctor
- **Precondition:** Patient has DOCTOR_CONSULT status.
- **Main flow:** Open consultation queue → select patient → review nurse's triage notes and vitals → review patient history → record SOAP note → add ICD-10 diagnosis → prescribe medications if needed → order lab tests if needed → sign off encounter → patient status changes to LAB_PENDING or BILLING.
- **Exception:** Sign-off blocked when diagnosis is empty.
- **Postcondition:** Encounter is signed off, prescriptions/lab orders created, patient routed to next station.

### UC-05 Process Lab Results
- **Actor:** Lab Technician
- **Precondition:** Patient has LAB_PENDING status.
- **Main flow:** Open lab order queue → select order → enter test results (value, unit, reference range, flag) → mark order complete → patient status changes to LAB_READY → doctor is notified.
- **Postcondition:** Lab results recorded, patient status updated to LAB_READY, activity log records lab completion.

### UC-06 Dispense Medication
- **Actor:** Pharmacist
- **Precondition:** Prescription exists with PENDING status.
- **Main flow:** Open pending prescription queue → select prescription → verify items and stock → dispense → inventory decrements per batch (FEFO) → prescription marked `DISPENSED` → charges post to invoice.
- **Exception:** Insufficient stock → partial dispense recorded, remainder stays pending.
- **Postcondition:** Prescription dispensed, inventory updated, charges added to invoice.

### UC-07 Generate Invoice and Collect Payment
- **Actor:** Receptionist / Accountant
- **Precondition:** Patient has BILLING status.
- **Main flow:** Open billing queue → select patient → review invoice items (consultation, labs, pharmacy) → apply discount if applicable → record payment → status becomes `PAID` or `PARTIALLY_PAID` → complete visit → print receipt.
- **Postcondition:** Invoice generated, payment recorded, visit completed, activity log records payment.

### UC-08 View Operational Reports
- **Actor:** Admin / Accountant
- **Main flow:** Open *Reports* → choose a report and date range → view charts and tables → export to CSV or PDF.

---

## 6. Database Design

### 6.1 Entity Relationship (textual)
```text
users ──1:1── staff_profiles ──1:N── doctor_availability
  │                 │
  │                 └──1:N── appointments ──1:1── encounters
  │                                                  │
patients ──1:N── appointments                        ├──1:N── vitals
   │                                                 ├──1:N── prescriptions ──1:N── prescription_items
   ├──1:N── encounters                               ├──1:N── lab_orders ──1:N── lab_results
   ├──1:N── invoices ──1:N── invoice_items           └──1:N── attachments
   │            └──1:N── payments
   └──1:N── patient_allergies

inventory_items ──1:N── inventory_batches ──1:N── dispense_records
services / lab_tests  → referenced by invoice_items / lab_orders
audit_logs (polymorphic: entity_type, entity_id)
activity_logs ── tracks patient movement through clinical stations
```

### 6.2 Key Tables
| Table | Key columns |
|---|---|
| `users` | id (uuid PK), username (unique), password_hash, role (enum), is_active, last_login_at, created_at |
| `staff_profiles` | id, user_id (FK unique), full_name, specialization, license_no, department_id, phone |
| `patients` | id, mrn (unique), first_name, last_name, dob, gender, phone, email, national_id (unique, nullable), address, blood_group, emergency_contact, is_archived, created_at |
| `patient_allergies` | id, patient_id (FK), substance, severity, notes |
| `doctor_availability` | id, doctor_id (FK), weekday (0-6), start_time, end_time, slot_minutes, effective_from, effective_to |
| `appointments` | id, patient_id, doctor_id, scheduled_at, duration_min, status (enum), reason, created_by, cancelled_reason — **unique (doctor_id, scheduled_at) where status ≠ CANCELLED** |
| `encounters` | id, appointment_id (FK unique, nullable), patient_id, nurse_id (FK, nullable), doctor_id (FK, nullable), chief_complaint, subjective, objective, assessment, plan, icd10_code, visit_status (enum), signed_at, signed_by |
| `vitals` | id, encounter_id, temperature_c, systolic, diastolic, pulse, resp_rate, spo2, weight_kg, height_cm, bmi (generated), recorded_by, recorded_at |
| `prescriptions` | id, encounter_id, patient_id, doctor_id, status (enum), issued_at, notes |
| `prescription_items` | id, prescription_id, inventory_item_id (nullable), drug_name, dosage, frequency, duration_days, route, instructions, quantity |
| `lab_tests` | id, code (unique), name, department, price, reference_range, unit |
| `lab_orders` | id, encounter_id, patient_id, ordered_by, status (enum), ordered_at, completed_at |
| `lab_results` | id, lab_order_id, lab_test_id, value, unit, reference_range, flag (H/L/N), entered_by, entered_at |
| `inventory_items` | id, name, generic_name, form, strength, unit_price, reorder_level, is_active |
| `inventory_batches` | id, item_id, batch_no, expiry_date, quantity_on_hand, cost_price |
| `dispense_records` | id, prescription_item_id, batch_id, quantity, dispensed_by, dispensed_at |
| `services` | id, code (unique), name, category, price, is_active |
| `invoices` | id, invoice_no (unique seq), patient_id, encounter_id (nullable), status (enum), subtotal, discount_amount, discount_reason, tax_amount, total, balance, issued_at, created_by |
| `invoice_items` | id, invoice_id, item_type (SERVICE/LAB/DRUG), ref_id, description, quantity, unit_price, line_total |
| `payments` | id, invoice_id, amount, method (enum), reference, received_by, received_at |
| `attachments` | id, encounter_id, file_name, mime_type, size_bytes, storage_path, uploaded_by |
| `audit_logs` | id, actor_user_id, action, entity_type, entity_id, before (jsonb), after (jsonb), ip, created_at |
| `activity_logs` | id, user_id (FK), action, entity_type, entity_id, details, created_at |
| `notifications` | id, user_id/patient_id, channel, payload (jsonb), status, sent_at |

### 6.3 Enumerations
```text
role            : ADMIN | RECEPTIONIST | DOCTOR | NURSE | LAB_TECH
appt_status     : SCHEDULED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
visit_status    : TRIAGE | DOCTOR_CONSULT | LAB_PENDING | LAB_READY | BILLING | COMPLETED
rx_status       : PENDING | PARTIALLY_DISPENSED | DISPENSED | CANCELLED
lab_status      : ORDERED | IN_PROGRESS | COMPLETED | CANCELLED
invoice_status  : DRAFT | ISSUED | PARTIALLY_PAID | PAID | VOID | REFUNDED
payment_method  : CASH | CARD | MOBILE_MONEY | BANK_TRANSFER
```

### 6.4 Integrity & Indexing
- All PKs are UUID v4; all FKs enforced with `ON DELETE RESTRICT` for clinical data.
- Indexes: `patients(phone)`, `patients(mrn)`, GIN trigram on `patients(last_name, first_name)`, `appointments(doctor_id, scheduled_at)`, `appointments(patient_id)`, `encounters(patient_id)`, `encounters(visit_status)`, `encounters(nurse_id)`, `invoices(patient_id, status)`, `audit_logs(entity_type, entity_id)`, `activity_logs(entity_type, entity_id)`.
- Money stored as `NUMERIC(12,2)`; timestamps as `TIMESTAMPTZ` in UTC.
- Financial operations (dispense + stock decrement, invoice + payment) run in a single transaction.
- Schema migrations are versioned (Prisma Migrate) and applied automatically at API container start.
- Encounter model: `appointmentId` and `doctorId` are optional to support walk-in patients; `nurseId` added for nurse assignment.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | p95 API response < 400 ms for list endpoints at 100 concurrent users; pagination capped at 50 rows |
| Availability | Target 99 % uptime; containers restart with `unless-stopped` |
| Security | HTTPS only, bcrypt hashing, JWT with short TTL, RBAC on every endpoint, Zod input validation, parameterized queries (ORM), Helmet headers, CORS allow-list, rate limiting on `/auth/*`, secrets via environment variables only |
| Privacy | Clinical data access restricted by role; full audit trail; soft delete only; encryption at rest via the volume/host |
| Usability | Responsive layout (≥ 360 px), keyboard-accessible forms, WCAG 2.1 AA contrast, inline validation |
| Maintainability | TypeScript end-to-end, ESLint + Prettier, ≥ 60 % unit test coverage on services, OpenAPI spec for the API |
| Backup | Nightly `pg_dump` to a mounted volume, 14-day retention |
| Observability | Structured JSON logs (pino), `/health` and `/ready` endpoints, request-id correlation |

---

## 8. CI/CD Pipeline (GitHub Actions)

```text
push / pull_request
   ├── lint          → eslint + prettier --check (web, api)
   ├── typecheck     → tsc --noEmit
   ├── test          → vitest/jest unit tests + API integration tests
   │                   against a postgres:16 service container
   ├── build         → docker build web, api (multi-stage, layer cache)
   └── on main only:
        ├── push images to GHCR (tags: sha + latest)
        ├── run prisma migrate deploy against the target DB
        └── deploy → SSH to host, docker compose pull && up -d,
                     then smoke-test /health (rollback to previous tag on failure)
```
Secrets (`DATABASE_URL`, `JWT_SECRET`, `SSH_KEY`, registry token) are stored as GitHub repository secrets. Environments: `preview` (per PR) and `production` (protected, manual approval).

---

## 9. Deliverables & 15-Day Plan

| Days | Milestone |
|---|---|
| 1–2 | This FRD, DB schema, wireframes, repo scaffold, Docker Compose skeleton |
| 3–4 | Auth, RBAC, user & staff management; CI pipeline (lint/test/build) green |
| 5–6 | Patient management + search |
| 7–8 | Appointments, availability, calendar |
| 9–10 | Encounters/EMR, vitals, prescriptions |
| 11 | Lab orders and results; pharmacy inventory & dispensing |
| 12 | Billing, payments, PDF invoices |
| 13 | Dashboards and reports |
| 14 | Hardening, tests, seed data, deploy pipeline to production host |
| 15 | Documentation, README, API docs, demo walkthrough, submission |

**Final submission:** GitHub repository (source + Dockerfiles + compose + workflows), this FRD plus README/API docs, the deployed application URL with demo credentials per role, and the GitHub Actions configuration.

---

## 10. Assumptions & Risks
- Single clinic/tenant; multi-tenancy is deferred.
- Email/SMS delivery uses a third-party provider (SMTP/Twilio); in the demo, notifications are logged rather than sent if credentials are absent.
- ICD-10 is used as a lookup list, not a licensed full terminology service.
- **Risk:** 15 days is tight for all modules — modules 4.1–4.7 are must-have; 4.8 reporting depth is the first scope to reduce if needed.
