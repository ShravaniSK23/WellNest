# WellNest Architectural Decision Records (ADRs)

## ADR-001: Scope Alignment & Strategic Feature Pruning

### Status
Accepted

### Context
The SRS document (Release 1.0) outlined several optional modules: Resource Center (4.6), Gamification (4.7), and Spotify Music Streaming integration (4.5). The lead architect prompt explicitly mandates focusing strictly on the core 4 pillars: Daily Mood Tracking, Wellness Dashboard, Anonymous Community Forum, and Therapist Support & Appointments.

### Decision
1. **Examine & Remove**: Resource Center (articles/audio meditation/breathing animations), Gamification (badges/motivation score), and Spotify Music Streaming API integrations are excluded from implementation scope.
2. **Retain Journaling**: `JournalEntry` is retained as a core entity to support qualitative reflection history and Dashboard analytics summaries.

### Consequences
- Reduced scope risk and external API dependencies.
- Enhanced focus on security, concurrency control, and privacy compliance.

---

## ADR-002: Dual Entity Modeling for Appointment Requests and Appointments

### Status
Accepted

### Context
SRS Section 4.3 describes booking requests starting in a "Pending Confirmation" state and requiring Therapist approval. Modeling a single `Appointment` entity across all states creates ambiguity between initial payment reservation holds and confirmed calendar appointments.

### Decision
Introduce two distinct entities:
1. `AppointmentRequest`: Captures the initial slot reservation request, notes, expiration timer, and payment authorization hold.
2. `Appointment`: Formed when the Therapist accepts the request. Governs the session lifecycle, rescheduling limits, WebRTC video token generation, and payment capture.

### Consequences
- Clean separation of concerns between payment hold/approval workflows and active calendar sessions.

---

## ADR-003: Timezone-Aware Daily Mood Tracking & Unique Index Constraint

### Status
Accepted

### Context
Users reside across various timezones. Evaluating "one entry per calendar day" using server-side UTC timestamps can cause incorrect streak calculations or double entry bugs near timezone boundaries.

### Decision
1. Store user's timezone preference (`user.timezone`) in profile.
2. Calculate local date (`YYYY-MM-DD`) on request submission.
3. Enforce a PostgreSQL composite unique constraint: `@@unique([help_seeker_id, local_date])`.
4. Re-submitting on the same local date executes an upsert/edit operation if before local midnight.

### Consequences
- Guarantees strict business rule compliance (REQ-MT-1, REQ-MT-4, BR-11) regardless of server location.

---

## ADR-004: Two-Phase Payment Integration (Auth-Hold & Capture)

### Status
Accepted

### Context
Payment processing for therapy sessions requires ensuring HelpSeekers have valid funds while preventing captured payments for requests that Therapists decline or fail to confirm within 24 hours.

### Decision
Implement a Two-Phase Payment Workflow via payment provider (e.g. Stripe PaymentIntents):
1. **Phase 1 (Request Submission)**: Create an `AUTHORIZED` hold on funds.
2. **Phase 2 (Therapist Confirmation)**: Execute payment `CAPTURE` when Therapist confirms appointment (BR-5).
3. **Cancellation**: If declined or expired, release authorization hold instantly without refund processing overhead.

### Consequences
- Eliminates transaction refund fees for declined or expired booking requests.

---

## ADR-005: Forum Anonymity & Pseudonym Isolation

### Status
Accepted

### Context
BR-7 and REQ-AC-5 mandate that user identities (email, real name, user ID) must NEVER be exposed in the Anonymous Community Forum.

### Decision
1. Each HelpSeeker is assigned a unique `Pseudonym` entity upon profile creation.
2. `CommunityPost` and `Comment` tables reference `pseudonym_id` directly (foreign key to `Pseudonym`, NOT `User` or `HelpSeeker`).
3. DTO serialization layers strip all user profile metadata.

### Consequences
- Prevents accidental PII leaks through API responses or database joins.

---

## ADR-006: Database Row Locking for Slot Reservation Concurrency

### Status
Accepted

### Context
High traffic could result in concurrent requests selecting the same therapist time slot (`AvailabilitySlot`), risking double-booking.

### Decision
1. Apply composite unique index `@@unique([therapist_id, start_time])` on `AvailabilitySlot`.
2. Wrap slot reservation in a PostgreSQL serializable transaction using `SELECT ... FOR UPDATE` row-level locks.

### Consequences
- Guarantees absolute double-booking prevention under concurrent loads.

---

## ADR-007: Automated 24-Hour Expiration & Refund Daemon

### Status
Accepted

### Context
REQ-TS-8 mandates that pending booking requests auto-expire if a Therapist does not respond within 24 hours.

### Decision
1. Deploy an automated background worker (cron task executing every 5 minutes).
2. Query `AppointmentRequest` entries where `status = PENDING` and `expires_at <= NOW()`.
3. Atomically transition request to `EXPIRED`, release `AvailabilitySlot` back to `AVAILABLE`, release payment authorization hold, and send email notifications.

### Consequences
- Ensures slots are not permanently locked by inactive therapists.

---

## ADR-008: 3-Report Auto-Hide Moderation Trigger

### Status
Accepted

### Context
BR-8 and REQ-AC-7 require community posts receiving 3 or more reports to be hidden automatically from public view pending moderator review.

### Decision
1. On report submission, insert `Report` record and atomically increment `report_count` on post/comment.
2. If `report_count >= 3`, update `status = HIDDEN` within the same database transaction.
3. Hidden items instantly surface in `/api/v1/moderation/queue`.

### Consequences
- Immediate community protection against inappropriate content.
