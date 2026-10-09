# WellNest Role-Based Access Control (RBAC) & Permissions Matrix

## 1. User Roles Overview
WellNest implements strict Role-Based Access Control (RBAC) to enforce user privacy, data isolation, and administrative governance.

1. **Guest / Unauthenticated User**: Public visitor limited to registration, login, password recovery, and persistent crisis helpline viewing.
2. **Help Seeker (`HELP_SEEKER`)**: Primary registered user class seeking mental wellness support. Accesses personal mood tracking, dashboard analytics, therapist booking, and pseudonymous forum discussions.
3. **Therapist (`THERAPIST`)**: Verified licensed mental health professional. Manages professional profile, availability slots, incoming appointment requests, and conducts video consultation sessions.
4. **Community Moderator (`MODERATOR`)**: WellNest staff or trained moderator. Reviews flagged forum content in the moderation queue, restores or permanently removes posts, and issues temporary posting suspensions.
5. **System Administrator (`ADMIN`)**: High-privilege administrator. Verifies therapist credentials, configures system settings, reviews full audit logs, and handles account escalations.

---

## 2. Resource-Permission Matrix

| Functional Resource / Endpoint | Guest | Help Seeker | Therapist | Community Moderator | System Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Crisis Helpline Banner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Account Registration & Login** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Upload Therapist Credentials** | ❌ | ❌ | ✅ (Pending) | ❌ | ❌ |
| **Verify / Reject Therapist License** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Log / Edit Own Daily Mood** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **View Own Dashboard & History** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **View Other HelpSeeker Mood/Journal** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Search Verified Therapists** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **View Unverified Therapist Profiles** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Manage Availability Slots** | ❌ | ❌ | ✅ (Verified) | ❌ | ❌ |
| **Submit Appointment Request** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Confirm / Decline Appointment** | ❌ | ❌ | ✅ (Assigned) | ❌ | ❌ |
| **Access Video Consultation Token** | ❌ | ✅ (Assigned) | ✅ (Assigned) | ❌ | ❌ |
| **Post / Comment in Forum** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Flag Forum Post or Comment** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **View Moderation Queue** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Execute Moderation Action** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View System Audit Logs** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Delete Account & Anonymize Data** | ❌ | ✅ (Self) | ✅ (Self) | ❌ | ✅ (Escalated) |

*Key: ✅ Allowed | ❌ Denied*

---

## 3. Data Access Scoping Rules & Privacy Isolation

### 3.1 HelpSeeker Data Isolation (SE-5, BR-10)
- A `HelpSeeker` can ONLY query mood entries, journal entries, wellness reports, and appointment history where `help_seeker_id === authenticated_user.help_seeker_id`.
- System Administrators and Community Moderators have **NO API access** to raw HelpSeeker mood or journal text.

### 3.2 Therapist Patient Scoping (SE-6)
- A `Therapist` can view appointment and session history ONLY for HelpSeekers who have booked a confirmed appointment with that specific Therapist (`appointment.therapist_id === authenticated_user.therapist_id`).
- Therapists cannot browse general HelpSeeker profiles or historical mood logs outside of session context.

### 3.3 Forum Pseudonym Privacy (BR-7, REQ-AC-5)
- Public forum endpoints strip all `User` and `HelpSeeker` table identifiers.
- DTO responses serialize ONLY `pseudonym_name`.
- Moderator queue endpoint displays `pseudonym_name` alongside flagged content. Unmasking a user's real email/name requires a System Administrator audit override, which is logged to `AuditLog`.

---

## 4. Therapist Onboarding & Verification State Machine

```
[ Register User (Role = THERAPIST) ]
                |
                v
  [ Upload License Credentials ] (REQ-UA-15)
                |
                v
 [ Account Status = PENDING_REVIEW ]  (BR-1: Invisible in Search)
                |
                +---------------------------------+
                |                                 |
     (Admin Approves Credentials)       (Admin Rejects License)
                |                                 |
                v                                 v
   [ Status = VERIFIED ]                 [ Status = REJECTED ]
   (BR-2: Visible in Search,              (Access Disabled,
    Slot creation enabled)               Notification sent)
```
