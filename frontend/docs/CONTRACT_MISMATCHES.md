# WellNest API Contract Audit & Mismatch Documentation

This document records the exact observations, differences, and adapter strategies between `docs/API_CONTRACT.md`, the backend OpenAPI document, and the live Express route implementations in `src/`.

---

## 1. Authentication Endpoints

### 1.1 Login Response Token Key
- **API_CONTRACT.md**: Specifies `accessToken` in login response:
  ```json
  { "accessToken": "eyJhbGci...", "user": { ... } }
  ```
- **Backend Implementation (`src/services/auth.service.ts`)**: Returns `token` instead of `accessToken`:
  ```json
  { "token": "eyJhbGci...", "user": { ... } }
  ```
- **Frontend Adapter Strategy**: The API client checks both:
  ```ts
  const token = response.data.token || response.data.accessToken;
  ```
  This ensures compatibility regardless of whether the backend aligns strictly with the written contract or its current implementation.

---

### 1.2 Registration Input Fields
- **API_CONTRACT.md**: Lists `{ email, password, fullName, role, timezone }`.
- **Backend Implementation (`src/services/auth.service.ts`)**:
  - For `THERAPIST` role, `licenseNumber` is strictly **mandatory** (`licenseNumber: string`). Optional fields `qualifications` and `biography` are also accepted.
  - For `HELP_SEEKER` role, `timezone` defaults to `'UTC'` if omitted.
  - Automatically verifies email in development/test environments.
- **Frontend Adapter Strategy**: The Registration UI dynamically shows therapist credential fields (`licenseNumber`, `qualifications`, `biography`) when `role === 'THERAPIST'`, and marks `licenseNumber` as required to prevent 400 Bad Request errors.

---

### 1.3 Multi-Factor Authentication (MFA) Login Flow
- **API_CONTRACT.md**: Does not detail the interim MFA challenge payload.
- **Backend Implementation**:
  - Mandatory for `THERAPIST`, `MODERATOR`, and `ADMIN` roles, or any user with `mfaEnabled: true`.
  - When credentials are valid but MFA verification is needed, the backend returns:
    ```json
    {
      "mfaRequired": true,
      "mfaPendingToken": "<jwt_string>",
      "message": "MFA token verification required."
    }
    ```
  - If a user with a mandatory MFA role has not enrolled yet, `AuthService.login` throws an `AppError` with status `401`, code `'MFA_REQUIRED'`, and details `{ mfaToken: string }`.
  - MFA verification endpoint is `POST /api/v1/auth/mfa/verify` accepting `{ userId, sessionId, mfaCode }`. The `userId` and `sessionId` are embedded in the `mfaPendingToken` JWT payload.
- **Frontend Adapter Strategy**: The frontend decodes `mfaPendingToken` to extract `userId` and `sessionId`, providing a seamless 6-digit TOTP input modal, and supports enrollment setup with QR code and secret key via `POST /api/v1/auth/mfa/setup`.

---

### 1.4 Forgot Password Response
- **Backend Implementation**: In addition to `{ message: "..." }`, returns `resetToken` in non-production responses for testing and development convenience.
- **Frontend Adapter Strategy**: The Forgot Password page presents the standard confirmation message to the user, and in development mode provides a quick-fill link if `resetToken` is returned by the server.

---

## 2. User Profile & Password Change

### 2.1 Profile Retrieval (`GET /api/v1/users/me`)
- Returns `{ user: { id, email, role, isEmailVerified, mfaEnabled, helpSeeker?, therapist?, moderator?, admin? } }`.
- The user's role-specific information is nested under the corresponding role key (e.g., `user.helpSeeker.fullName` or `user.therapist.fullName`).
- **Frontend Adapter Strategy**: Normalizes user profile helper functions to display the user's appropriate name and details consistently across all roles.

### 2.2 Password Change (`POST /api/v1/users/me/password`)
- Requires `{ currentPassword, newPassword }`.
- Automatically revokes all active sessions upon successful password change.
- **Frontend Adapter Strategy**: Notifies the user of session invalidation and prompts re-login.

---

## 3. Session Expiration & Inactivity Rules
- **Backend Standard (REQ-UA-14)**: 30 minutes of inactivity revokes the session on the backend.
- **Backend Error Code**: Returns `401` with `error.code: "SESSION_TIMEOUT"` or `"SESSION_REVOKED"`.
- **Frontend Adapter Strategy**: Axios response interceptor intercepts these specific error codes and triggers a dedicated Session Expiry modal, guiding the user to re-authenticate without abrupt page crashes.
