# WellNest Quality Assurance & Automated Test Plan

## 1. Testing Strategy Overview
The WellNest testing strategy employs a multi-tiered automated verification model to ensure architectural integrity, business rule compliance, and security isolation.

```
       / \
      / E2E \         Playwright (Critical User Workflows)
     /-------\
    / Integration \   Supertest + Test PostgreSQL Database (API Contracts & DB Transactions)
   /---------------\
  /   Unit Tests    \ Vitest / Jest (Domain Logic, Streak Engine, Encryption Helpers)
 /-------------------\
```

---

## 2. Test Execution Environment & Tools
- **Unit Testing**: Vitest / Jest (Fast, isolated testing of pure functions, date logic, streak engines).
- **Integration Testing**: Supertest against a dedicated PostgreSQL docker container (`wellnest_test_db`).
- **End-to-End (E2E) Testing**: Playwright running against the Vite preview server and backend API.
- **CI Pipeline Automation**: GitHub Actions running linting, unit tests, integration tests, and coverage enforcement ($> 85\%$ coverage baseline).

---

## 3. High-Priority Functional & Rule Test Suite

### Module 1: Daily Mood Tracking & Timezone Engine

| Test Case ID | Target Feature / Rule | Test Description & Inputs | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-MT-001** | One Entry / Local Day (REQ-MT-1, REQ-MT-4) | Submit mood `😊` for `localDate = "2026-10-09"`. Submit second mood `😔` for same date. | Second submission updates existing record. Total count of entries for user on `2026-10-09` remains 1. |
| **TC-MT-002** | 500-Char Note Limit (REQ-MT-2) | Submit mood entry with note length = 501 characters. | Backend returns `400 Bad Request` with validation error message. |
| **TC-MT-003** | Timezone Streak Increment (REQ-MT-8, BR-11) | User logged yesterday (`2026-10-08`). User logs today (`2026-10-09`). | Streak counter increments from $N$ to $N+1$. |
| **TC-MT-004** | Streak Reset on Missed Day (REQ-MT-8, BR-11) | User last logged on `2026-10-07`. User logs on `2026-10-09` (missed 10-08). | Streak counter resets to `1`. |

---

### Module 2: Wellness Dashboard & Privacy Isolation

| Test Case ID | Target Feature / Rule | Test Description & Inputs | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-WD-001** | Ownership Isolation (SE-5, BR-10) | User A attempts `GET /api/v1/dashboard/summary` using JWT of User B. | API returns only User B's data. Zero leakage of User A data. |
| **TC-WD-002** | Non-Diagnostic Disclaimer (SF-3) | Query `/api/v1/dashboard/summary`. | Response payload contains `analytics.disclaimer` matching non-diagnostic text. |

---

### Module 3: Therapist Support & Appointment Management

| Test Case ID | Target Feature / Rule | Test Description & Inputs | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-TS-001** | Unverified Therapist Filter (BR-1, BR-2) | Query `GET /api/v1/therapists`. Search includes Therapist T (Status = `UNVERIFIED`). | Response array excludes Therapist T completely. |
| **TC-TS-002** | Double-Booking Prevention (REQ-TS-6) | Issue two simultaneous `POST /api/v1/appointments/request` calls for same `slotId`. | Exactly one request succeeds (`202 Accepted`). Second request fails with `409 Conflict`. |
| **TC-TS-003** | 24-Hour Auto-Release Daemon (REQ-TS-8) | Create pending request with `createdAt = 25 hours ago`. Trigger expiration job. | Request transitions to `EXPIRED`. Slot status resets to `AVAILABLE`. |
| **TC-TS-004** | Payment Auth & Capture (BR-5) | Submit booking request -> Therapist confirms. | Initial request creates `AUTHORIZED` payment hold. Confirmation captures payment (`CAPTURED`). |
| **TC-TS-005** | Therapist Cancellation Refund (BR-6) | Therapist cancels a confirmed appointment. | System initiates full refund (`FULL_REFUND_INITIATED`). |
| **TC-TS-006** | HelpSeeker Cancellation Policy (BR-3) | HelpSeeker cancels 30 hours before start vs 2 hours before start. | 30h prior triggers full refund. 2h prior applies cancellation penalty per BR-3. |
| **TC-TS-007** | Video Link Time Gating (REQ-TS-16) | Request video token 30 minutes before appointment start time. | API returns `403 Forbidden` ("Token available only 10 mins prior"). |
| **TC-TS-008** | Video Link Participant Restrict (REQ-TS-15) | Request video token as an uninvolved third user. | API returns `403 Forbidden`. |

---

### Module 4: Anonymous Community Forum & Moderation

| Test Case ID | Target Feature / Rule | Test Description & Inputs | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-AC-001** | Forum Pseudonym Anonymity (BR-7, REQ-AC-5) | HelpSeeker posts to forum. Inspect HTTP response payload. | Response contains `authorPseudonym`. Email, real name, and user ID are absent. |
| **TC-AC-002** | 3-Report Auto-Hide (BR-8, REQ-AC-7) | Post receives 1st, 2nd, and 3rd report from different users. | Upon 3rd report, post status automatically updates to `HIDDEN` and appears in moderator queue. |
| **TC-AC-003** | Moderator Action Enforcement (BR-9, REQ-AC-9) | Moderator approves `PERMANENT_REMOVE` action on hidden post. | Post status transitions to `REMOVED`. Further public queries return `404`. |

---

### Module 5: Security & Audit Logging

| Test Case ID | Target Feature / Rule | Test Description & Inputs | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-SEC-001** | Audit Log Capture (SE-8, REQ-AC-11) | Perform login, therapist verification, and post deletion. Query `/api/v1/admin/audit-logs`. | Audit logs record user ID, action type, IP address, and timestamp. |
| **TC-SEC-002** | PCI-DSS Card Safety (CO-3, SE-7) | Inspect request schemas and database tables for card numbers/CVV. | Zero fields exist for credit card data. Gateway uses tokenization. |
| **TC-SEC-003** | SQL Injection & XSS Prevention (SE-11) | Submit post with script tags `<script>alert(1)</script>` and SQL payloads. | Content sanitized safely; ORM parameters prevent SQL injection. |
