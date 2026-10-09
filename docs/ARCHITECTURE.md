# WellNest System Architecture Specification

## 1. High-Level System Architecture

WellNest follows a decoupled Client-Server architecture utilizing modern web standards. The frontend is a Single Page Application (SPA) built with React, TypeScript, Vite, and Tailwind CSS. The backend application server is implemented in Node.js with Express and TypeScript, exposing a structured RESTful API. Data persistence is managed via PostgreSQL utilizing Prisma ORM.

```
                                  +---------------------------------------+
                                  |         React 18 + TypeScript         |
                                  |           (Vite + Tailwind)           |
                                  +-------------------+-------------------+
                                                      |
                                                      | HTTPS / REST / TLS 1.3
                                                      v
                                  +-------------------+-------------------+
                                  |         Express API Gateway           |
                                  |       (Auth, RBAC, Rate Limit)        |
                                  +-------------------+-------------------+
                                                      |
            +-----------------------------------------+-----------------------------------------+
            |                                         |                                         |
            v                                         v                                         v
+-----------+-----------+                 +-----------+-----------+                 +-----------+-----------+
|   Mood & Dashboard    |                 |   Therapist & Booking     |                 |  Anonymous Community   |
|        Service        |                 |        Service        |                 |        Service        |
+-----------+-----------+                 +-----------+-----------+                 +-----------+-----------+
            |                                         |                                         |
            +-----------------------------------------+-----------------------------------------+
                                                      |
                                                      v
                                  +-------------------+-------------------+
                                  |       Prisma ORM Data Access Layer    |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +-------------------+-------------------+
                                  |    PostgreSQL Relational Database     |
                                  +-------------------+-------------------+
                                                      |
        +---------------------------------------------+---------------------------------------------+
        |                                             |                                             |
        v                                             v                                             v
+-------+-------+                             +-------+-------+                             +-------+-------+
| Payment Gate  |                             | WebRTC Video  |                             | Notification  |
| (Stripe API)  |                             | (Daily.co)    |                             | (SendGrid)    |
+---------------+                             +---------------+                             +---------------+
```

---

## 2. Layered Software Architecture

```
[ Presentation Layer ]      React SPA (Pages, Components, Custom Hooks, Context State)
                                    |
[ API Routing Layer ]       Express Routers -> Middleware (CORS, Helmet, Auth, RBAC, Validator)
                                    |
[ Service Layer ]           Business Logic Modules (MoodService, BookingService, CommunityService)
                                    |
[ Data Access Layer ]       Prisma Client (Type-safe Queries, Migrations, DB Transactions)
                                    |
[ Storage Layer ]           PostgreSQL DB (ACID Transactions, Row Locks, Unique Constraints)
```

---

## 3. Detailed Technical Mechanisms & Design Directives

### 3.1 Daily Mood Tracking & Timezone Streak Engine
- **One Entry Per Local Calendar Day**:
  - Each `MoodEntry` stores `local_date` (ISO `YYYY-MM-DD` string derived from user's local timezone header/profile setting `user.timezone`).
  - Database enforces a composite unique constraint `@@unique([help_seeker_id, local_date])`.
  - Submitting a mood for a date that already has an entry acts as an **overwrite/edit** if submitted before local midnight (REQ-MT-3, REQ-MT-4).
  - Note length is limited to 500 characters via database constraint `@db.VarChar(500)` and API validation schemas.
- **Timezone-Aware Streak Counter**:
  - When a `MoodEntry` is logged, the `MoodStreak` evaluation service calculates the difference between `local_date` and the user's `last_logged_date`.
  - If `local_date == last_logged_date + 1 day`: `current_streak = current_streak + 1`.
  - If `local_date == last_logged_date`: `current_streak` remains unchanged (edit operation).
  - If `local_date > last_logged_date + 1 day`: streak is broken; `current_streak` resets to `1` (BR-11, REQ-MT-8).
  - `longest_streak = max(longest_streak, current_streak)`.

---

### 3.2 Dashboard Data Ownership & Privacy Isolation
- **Data Scoping (SE-5, BR-10)**:
  - All queries for `/api/v1/dashboard/*`, `/api/v1/moods/*`, and `/api/v1/journals/*` strictly append `WHERE help_seeker_id = authenticated_user.help_seeker_id`.
  - Cross-user data access returns `403 Forbidden` or `404 Not Found`.

---

### 3.3 Verified Therapist Discovery & Search Gating
- **Verification Rule (BR-1, BR-2, REQ-TS-4)**:
  - A therapist profile must have `verification_status = VERIFIED` and `is_visible = true` to appear in search queries.
  - The search endpoint `/api/v1/therapists` enforces `WHERE verification_status = 'VERIFIED'` automatically.
  - Attempting to view an unverified therapist profile as a HelpSeeker returns `404 Not Found`.

---

### 3.4 Appointment Lifecycle & Concurrency Control

#### State Machine
```
[ Available Slot ] ---> (HelpSeeker Request + Payment Hold) ---> [ PENDING_CONFIRMATION ]
                                                                        |
                       +------------------------------------------------+------------------------------------------------+
                       |                                                |                                                |
            (Therapist Confirms)                              (Therapist Declines OR                            (HelpSeeker Cancels)
                       |                                       24h Timer Expires)                                |
                       v                                                |                                                v
                  [ CONFIRMED ]                                         v                                           [ CANCELED ]
                       |                                          [ CANCELED ]                                   (Refund per BR-3)
        +--------------+--------------+                      (Slot Released / Refund)
        |                             |
(Session Completed)          (No-Show Reported)
        v                             v
   [ COMPLETED ]                 [ NO_SHOW ]
```

#### 24-Hour Auto-Release & Double-Booking Prevention
- **Double-Booking Prevention**:
  - `AvailabilitySlot` has a unique constraint `@@unique([therapist_id, start_time])`.
  - When booking, a database transaction uses `SELECT ... FOR UPDATE` on `AvailabilitySlot`.
  - If `slot.is_booked == true` or `slot.status != 'AVAILABLE'`, transaction rolls back with `409 Conflict`.
- **24-Hour Request Auto-Release (REQ-TS-8)**:
  - An asynchronous background worker executes every 5 minutes checking `AppointmentRequest` records in `PENDING_CONFIRMATION` state created > 24 hours ago.
  - Expired requests transition to `CANCELED_EXPIRED`, the held slot is marked `AVAILABLE`, payment hold is released, and notification is dispatched.

---

### 3.5 Two-Phase Payment Processing Workflow
- **Phase 1: Authorization Hold (BR-5)**:
  - On appointment request submission, the payment gateway creates a payment authorization hold (`Payment` status = `AUTHORIZED`).
  - No funds are transferred to the Therapist yet.
- **Phase 2: Payment Capture**:
  - When the Therapist accepts the request, the backend triggers `paymentGateway.capture(payment_intent_id)` and status transitions to `CAPTURED`.
- **Refund Logic**:
  - **Therapist Cancellation (BR-6)**: Automatic 100% refund initiated immediately regardless of time.
  - **HelpSeeker Cancellation (BR-3)**: If canceled $\ge 24$ hours before `start_time`, full refund. If $< 24$ hours, refund subject to cancellation policy (non-refundable or partial fee per policy).

---

### 3.6 WebRTC Video Consultation Access Security
- **Access Gating (REQ-TS-15, REQ-TS-16, SI-2)**:
  - Video links/tokens are generated on-demand via `/api/v1/appointments/:id/video-token`.
  - Token issuance verifies:
    1. `appointment.status == 'CONFIRMED'`.
    2. `authenticated_user.id` matches either `appointment.help_seeker.user_id` or `appointment.therapist.user_id`.
    3. `current_time >= appointment.start_time - 10 minutes` and `current_time <= appointment.end_time`.
  - Unauthorized or premature token requests return `403 Forbidden`.

---

### 3.7 Anonymous Forum Pseudonym Isolation Architecture
- **Pseudonym Isolation (BR-7, REQ-AC-1, REQ-AC-5)**:
  - `HelpSeeker` profile is associated with a distinct `Pseudonym` record (`pseudonym_name`, e.g. "CalmRiver42").
  - `CommunityPost` and `Comment` foreign keys reference `pseudonym_id` (NOT `user_id` or `help_seeker_id`).
  - Public API serializes ONLY `pseudonym_name` and `created_at`. No user IDs, emails, or real names exist in public forum DTOs.

---

### 3.8 3-Report Auto-Hide & Moderation Workflow
- **Auto-Hide Trigger (BR-8, REQ-AC-7)**:
  - When a user submits a report via `/api/v1/community/reports`, the system records the `Report` entity and atomically increments `post.report_count`.
  - If `post.report_count >= 3`, post status transitions to `HIDDEN` instantly in the same transaction.
  - Hidden content is automatically added to the `ModerationQueue` for Moderator/Admin review.
- **Moderator Enforcement (BR-9, REQ-AC-9)**:
  - Moderators can: (1) Restore content, (2) Permanently delete content, or (3) Issue a posting suspension (up to 7 days).

---

### 3.9 Audit Logging Subsystem
- **Audit Requirement (SE-8, REQ-AC-11)**:
  - Every authentication event, role change, therapist credential review, moderation action, and sensitive record access creates an immutable `AuditLog` entry:
    `{ id, user_id, action, target_resource, ip_address, user_agent, payload_summary, timestamp }`.
  - Logs are retained for a minimum of 12 months.

---

### 3.10 Non-Diagnostic Safety & Persistent Crisis Helpline
- **Crisis Helpline Banner (SF-1, SF-2)**:
  - Embedded in global frontend state and rendered on all mood, journal, and community views.
- **Non-Diagnostic Disclaimer (SF-3)**:
  - Analytics and dashboard trend outputs carry an explicit UI tag: *"Informational summary only. Not a clinical diagnosis."*
