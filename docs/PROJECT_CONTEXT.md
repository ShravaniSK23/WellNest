# WellNest Project Context & Scope Baseline

## 1. Executive Summary & Vision
WellNest is an integrated, web-based mental wellness portal designed to provide holistic emotional support for users (students and working professionals). The platform provides daily emotional tracking, therapist discovery and video consultation booking, anonymous peer community discussions, and personalized wellness analytics dashboard summaries.

The system emphasizes **privacy by design**, **safety compliance**, and **role-restricted security**.

---

## 2. Project Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **API Standard**: RESTful architecture with OpenAPI 3.0 specification
- **Infrastructure & Environment**: Docker & Docker Compose
- **Testing Frameworks**: Vitest / Jest (Unit & Integration), Supertest (API Testing), Playwright (E2E Testing)

---

## 3. Explicit System Scope & Boundaries

### 3.1 Core In-Scope Modules (Authoritative Baseline)
1. **Daily Mood Tracking**: Emoji-based daily mood logging (max 1 entry per local calendar day), optional free-text note (max 500 characters), timezone-aware consecutive streak calculation, and motivational quote display.
2. **Wellness Dashboard**: Centralized analytics view displaying mood heatmaps/charts (7/30/90 days), summary metrics, weekly generated wellness reports, upcoming confirmed therapy appointments, and therapist recommendation widgets. Includes `JournalEntry` records to support wellness metrics.
3. **Therapist Support & Appointment Management**: Filtered therapist discovery, profile & credential viewing, slot selection, appointment request workflow, two-phase payment processing, 24-hour request expiration, double-booking prevention, cancellation/rescheduling management, and secure WebRTC video consultation token generation.
4. **Anonymous Community Forum**: Discord/Reddit-style topic-based channels, system-assigned non-identifying pseudonyms, post/comment creation, community guideline violation reporting, automated 3-report hiding mechanism, and community moderator queue.
5. **Supporting Infrastructure**: User registration, authentication (JWT + HTTP-only cookies), Role-Based Access Control (RBAC for HelpSeeker, Therapist, Moderator, Admin), optional/mandatory Multi-Factor Authentication (MFA), account deletion/anonymization (30-day SLA), and system audit logging.

---

### 3.2 Out-of-Scope Modules (Explicit Scope Restrictions)
Per architectural directive and prompt scope instructions, the following SRS Release 1.0 optional/secondary modules are **EXCLUDED** from implementation:
- **Resource Center** (SRS 4.6): Excludes self-help article libraries, embedded guided audio meditation sessions, and interactive breathing exercise animations.
- **Gamification Engine** (SRS 4.7): Excludes achievement badges, weekly wellness challenge generation, motivation score calculations, and milestone progress rewards.
- **Standalone Personalized Wellness Integrations** (SRS 4.5 / SI-4 / DE-4): Excludes third-party music streaming integration (e.g. Spotify API) for mood-based playlist recommendations. (Note: `JournalEntry` is retained to support emotional reflections and dashboard analytics).

---

## 4. SRS vs Scope Conflict Analysis & Resolution Log

| Conflict / Ambiguity Topic | SRS v1.0 Requirement | Architectural Scope Baseline | Resolution & Rationale |
| :--- | :--- | :--- | :--- |
| **Personalized Wellness & Spotify Integration** | Section 4.5 & REQ-MT-6 / SI-4 / DE-4 require mood-based music recommendations via external API. | Excluded from release scope. | External streaming API dependencies add unnecessary external risk. Scope is strictly focused on core tracking, dashboard, therapy, and community. |
| **Resource Center & Gamification** | Sections 4.6 & 4.7 define Resource Center & Gamification modules. | Excluded from release scope. | Priority directive restricts scope strictly to the core 4 pillars (Mood Tracking, Dashboard, Forum, Therapist Support). |
| **Journaling Entity Placement** | SRS includes Journaling under 4.5 (Personalized Wellness). | Retained in Database Schema & Wellness Dashboard. | `JournalEntry` is required per prompt entity specifications and provides core qualitative data for Dashboard analytics & Data Export (OR-1). |
| **Appointment Lifecycle vs Entities** | SRS REQ-TS-7 states booking creates a "Pending Confirmation" appointment. | Split into explicit `AppointmentRequest` and `Appointment` entities. | Separating the initial request/holding transaction (`AppointmentRequest`) from confirmed calendar sessions (`Appointment`) ensures clean state management and double-booking prevention. |
| **Therapist Profile Search Gating** | SRS REQ-TS-4 & BR-2 prohibit unverified therapists from search results. | Enforced at DB Query and RBAC Middleware level (`is_verified = true`). | Strict isolation ensures unverified therapist profiles are never leaked via API endpoints. |

---

## 5. Non-Diagnostic Safety & Regulatory Compliance Directives
1. **Safety Helplines (SF-1, SF-2)**: A persistent, non-intrusive banner linking to regional crisis helplines (e.g., 988 Suicide & Crisis Lifeline) MUST be present on all screens involving mood logging, journaling, or community forum interaction. Helplines are explicitly labeled as non-emergency substitutes.
2. **Non-Diagnostic Analytics (SF-3)**: System insights (e.g., mood trends, variability) MUST explicitly display a disclaimer stating that insights are informational and **do not constitute clinical or medical diagnosis**.
3. **PCI-DSS Credit Card Safety (CO-3, SE-7)**: Raw credit card numbers, CVVs, or expiration dates shall **NEVER** be stored or transmitted through WellNest servers. All payment handling is delegated to a PCI-DSS compliant provider (e.g., Stripe/Razorpay) via client-side tokenization.
4. **Data Privacy & Encryption (SE-1, SE-2)**: Data in transit is encrypted using TLS 1.2+. Sensitive health data at rest (journal entries, mood notes) is encrypted using AES-256.
