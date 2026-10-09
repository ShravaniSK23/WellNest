# WellNest REST API Specification & OpenAPI Contract

## 1. Global API Standards
- **Base URL**: `https://api.wellnest.org/api/v1`
- **Protocol**: HTTPS (TLS 1.3 mandated)
- **Format**: JSON (`Content-Type: application/json`)
- **Authentication**: HTTP-Only Cookie or Header `Authorization: Bearer <jwt_access_token>`
- **Error Response Standard**:
```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "The requested appointment time slot has already been reserved.",
    "details": null,
    "timestamp": "2026-10-09T18:50:00Z"
  }
}
```

---

## 2. Authentication & User Management (`/auth`, `/users`)

### 2.1 Register User Account
- **Endpoint**: `POST /api/v1/auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "Jane Doe",
  "role": "HELP_SEEKER",
  "timezone": "Asia/Kolkata"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Registration successful. Please check your email for the verification link.",
  "userId": "u-1234-5678"
}
```
- **Error Statuses**: `400 Bad Request` (Invalid password rules), `409 Conflict` (Email registered).

---

### 2.2 User Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "u-1234-5678",
    "email": "user@example.com",
    "role": "HELP_SEEKER",
    "isEmailVerified": true
  }
}
```
- **Error Statuses**: `401 Unauthorized`, `423 Locked` (5 failed attempts within 10 min -> 15 min lock per REQ-UA-7).

---

### 2.3 Upload Therapist Credentials (Therapist Applicants)
- **Endpoint**: `POST /api/v1/therapists/credentials`
- **Auth**: Authenticated (`THERAPIST` unverified)
- **Request Body**:
```json
{
  "documentType": "MEDICAL_LICENSE",
  "documentUrl": "https://secure-docs.wellnest.org/license_9876.pdf"
}
```
- **Response `201 Created`**:
```json
{
  "credentialId": "c-9988-7766",
  "status": "PENDING_REVIEW"
}
```

---

## 3. Daily Mood Tracking & Analytics (`/moods`, `/dashboard`)

### 3.1 Record / Edit Daily Mood Entry
- **Endpoint**: `POST /api/v1/moods`
- **Auth**: Authenticated (`HELP_SEEKER`)
- **Request Body**:
```json
{
  "localDate": "2026-10-09",
  "moodEmoji": "😊",
  "note": "Had a productive day studying."
}
```
- **Response `200 OK` / `201 Created`**:
```json
{
  "moodEntry": {
    "id": "m-1122-3344",
    "localDate": "2026-10-09",
    "moodEmoji": "😊",
    "note": "Had a productive day studying.",
    "updatedAt": "2026-10-09T18:50:00Z"
  },
  "streak": {
    "currentStreak": 5,
    "longestStreak": 12
  }
}
```
- **Validation**: Note max length = 500 chars (REQ-MT-2). Re-posting on same local date updates existing entry (REQ-MT-3, REQ-MT-4).

---

### 3.2 Get Current Mood Streak
- **Endpoint**: `GET /api/v1/moods/streak`
- **Auth**: Authenticated (`HELP_SEEKER`)
- **Response `200 OK`**:
```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "lastLoggedDate": "2026-10-09"
}
```

---

### 3.3 Get Wellness Dashboard Summary
- **Endpoint**: `GET /api/v1/dashboard/summary?rangeDays=30`
- **Auth**: Authenticated (`HELP_SEEKER`)
- **Response `200 OK`**:
```json
{
  "moodHistory": [
    { "date": "2026-10-09", "moodEmoji": "😊" }
  ],
  "analytics": {
    "mostFrequentMood": "😊",
    "moodVariability": "LOW",
    "journalingFrequency": 4,
    "disclaimer": "Informational summary only. Not a clinical diagnosis."
  },
  "upcomingAppointments": [
    {
      "appointmentId": "apt-5544-3322",
      "therapistName": "Dr. Sarah Jenkins",
      "startTime": "2026-10-12T10:00:00Z",
      "status": "CONFIRMED"
    }
  ],
  "recommendedTherapists": [
    {
      "therapistId": "t-7788-9900",
      "fullName": "Dr. Marcus Vance",
      "specialization": "Anxiety & Stress",
      "consultationFee": 80.00
    }
  ],
  "showNeedSomeoneToTalkPrompt": false
}
```

---

## 4. Therapist Discovery & Appointments (`/therapists`, `/appointments`)

### 4.1 Search Verified Therapists
- **Endpoint**: `GET /api/v1/therapists?specialization=Anxiety&maxFee=100&page=1&limit=10`
- **Auth**: Authenticated (`HELP_SEEKER`)
- **Response `200 OK`**:
```json
{
  "therapists": [
    {
      "id": "t-7788-9900",
      "fullName": "Dr. Sarah Jenkins",
      "biography": "Clinical psychologist specializing in cognitive behavioral therapy.",
      "qualifications": "Ph.D. Clinical Psychology",
      "yearsOfExperience": 10,
      "consultationFee": 90.00,
      "averageRating": 4.9,
      "verificationStatus": "VERIFIED"
    }
  ],
  "pagination": { "page": 1, "totalPages": 1, "totalCount": 1 }
}
```
- **Gating**: Unverified therapists are automatically filtered out (BR-2, REQ-TS-4).

---

### 4.2 Submit Appointment Request & Reserve Slot
- **Endpoint**: `POST /api/v1/appointments/request`
- **Auth**: Authenticated (`HELP_SEEKER`)
- **Request Body**:
```json
{
  "therapistId": "t-7788-9900",
  "slotId": "slot-123-abc",
  "paymentMethodToken": "pm_tok_test_9988"
}
```
- **Response `202 Accepted`**:
```json
{
  "requestId": "req-4433-2211",
  "appointmentId": "apt-5544-3322",
  "status": "PENDING_CONFIRMATION",
  "expiresAt": "2026-10-10T18:50:00Z",
  "paymentStatus": "AUTHORIZED"
}
```
- **Error Statuses**: `409 Conflict` (Slot locked/booked).

---

### 4.3 Confirm Appointment (Therapist Action)
- **Endpoint**: `POST /api/v1/appointments/:id/confirm`
- **Auth**: Authenticated (`THERAPIST` - Assigned to appointment)
- **Response `200 OK`**:
```json
{
  "appointmentId": "apt-5544-3322",
  "status": "CONFIRMED",
  "paymentStatus": "CAPTURED"
}
```

---

### 4.4 Cancel Appointment
- **Endpoint**: `POST /api/v1/appointments/:id/cancel`
- **Auth**: Authenticated (`HELP_SEEKER` or `THERAPIST`)
- **Request Body**:
```json
{
  "reason": "Schedule conflict"
}
```
- **Response `200 OK`**:
```json
{
  "appointmentId": "apt-5544-3322",
  "status": "CANCELED",
  "refundStatus": "FULL_REFUND_INITIATED",
  "refundAmount": 90.00
}
```

---

### 4.5 Get WebRTC Video Consultation Session Token
- **Endpoint**: `GET /api/v1/appointments/:id/video-token`
- **Auth**: Authenticated (`HELP_SEEKER` or `THERAPIST` associated with appointment)
- **Response `200 OK`**:
```json
{
  "videoRoomUrl": "https://wellnest.daily.co/session-apt-5544-3322",
  "sessionToken": "ey...video_jwt...",
  "expiresAt": "2026-10-12T11:00:00Z"
}
```
- **Gating**: Returns `403 Forbidden` if requested $> 10$ minutes before scheduled start time (REQ-TS-16).

---

## 5. Anonymous Community Forum (`/community`)

### 5.1 Create Post
- **Endpoint**: `POST /api/v1/community/posts`
- **Auth**: Authenticated (`HELP_SEEKER`)
- **Request Body**:
```json
{
  "channel": "STRESS",
  "title": "Managing exam anxiety",
  "content": "Does anyone have recommendations for staying calm during finals week?"
}
```
- **Response `201 Created`**:
```json
{
  "post": {
    "id": "p-9900-1122",
    "channel": "STRESS",
    "authorPseudonym": "QuietOcean14",
    "title": "Managing exam anxiety",
    "content": "Does anyone have recommendations for staying calm during finals week?",
    "reportCount": 0,
    "status": "VISIBLE",
    "createdAt": "2026-10-09T18:50:00Z"
  }
}
```
- **Anonymity Rule**: API output exposes `authorPseudonym` ONLY. No user IDs or real names (BR-7, REQ-AC-5).

---

### 5.2 Flag Post or Comment
- **Endpoint**: `POST /api/v1/community/reports`
- **Auth**: Authenticated User
- **Request Body**:
```json
{
  "postId": "p-9900-1122",
  "reason": "INAPPROPRIATE",
  "details": "Contains offensive language."
}
```
- **Response `200 OK`**:
```json
{
  "reportId": "rep-7766-5544",
  "contentHidden": true,
  "currentReportCount": 3
}
```
- **Auto-Hide Logic**: When total reports $\ge 3$, `contentHidden` becomes `true` and post transitions to `HIDDEN` (BR-8, REQ-AC-7).

---

## 6. Moderation & Administration (`/moderation`, `/admin`)

### 6.1 Get Moderation Queue
- **Endpoint**: `GET /api/v1/moderation/queue`
- **Auth**: Authenticated (`MODERATOR`, `ADMIN`)
- **Response `200 OK`**:
```json
{
  "queue": [
    {
      "postId": "p-9900-1122",
      "title": "Managing exam anxiety",
      "reportCount": 3,
      "reasons": ["INAPPROPRIATE"],
      "status": "HIDDEN"
    }
  ]
}
```

---

### 6.2 Admin Verify Therapist Profile
- **Endpoint**: `POST /api/v1/admin/therapists/:id/verify`
- **Auth**: Authenticated (`ADMIN`)
- **Request Body**:
```json
{
  "decision": "APPROVED",
  "notes": "Verified against state medical license registry."
}
```
- **Response `200 OK`**:
```json
{
  "therapistId": "t-7788-9900",
  "verificationStatus": "VERIFIED",
  "isVisible": true
}
```
