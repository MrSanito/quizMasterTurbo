# QuizMasterTurbo Authentication Module

QuizMasterTurbo implements a state-of-the-art, secure, and robust authentication system. This module is built using **Express.js**, **Prisma** (PostgreSQL), **Redis**, and **JSON Web Tokens (JWT)**.

It goes beyond simple JWT authentication by incorporating advanced security patterns, including:
1. **DPoP (Demonstrating Proof-of-Possession at the Application Layer)** to prevent token replay attacks.
2. **Refresh Token Rotation (RTR)** with session-family grouping for automatic replay/theft detection.
3. **Multi-device / Active Sessions Management** with capabilities to revoke sessions granularly.
4. **Access Token Blacklisting** upon logout to terminate sessions instantly.
5. **Two-Factor/Double OTP Verification** (Sign-up Email verification + Login OTP validation).

---

## 🛠 Architecture & Tech Stack
* **Runtime / Framework**: Node.js + Express.js + TypeScript
* **Database**: PostgreSQL (Prisma ORM) for long-term user & session persistence.
* **In-Memory Cache**: Redis for transient OTP storage, rate-limiting, registration queues, public keys, and token blacklisting.
* **Token Standard**: JWT (HMAC SHA-256) split into:
  * Short-lived **Access Token** (`accessToken` cookie, 15 minutes TTL).
  * Long-lived **Refresh Token** (`refreshToken` cookie & Redis storage, 7 days TTL).

---

## 🔒 Advanced Security Features

### 1. DPoP (Demonstrating Proof-of-Possession)
To prevent unauthorized clients from using stolen tokens, the auth system supports RFC 9449 DPoP:
* During login (`/verifyLoginOTP`), the client can supply their public key in JWK (JSON Web Key) format (`publicKeyJwk`).
* The system computes a thumbprint using SHA-256 of the canonicalized JWK structure and persists it in the `Session` record in the database.
* The raw public JWK is stored in Redis (`pubkey:${sessionId}`) for sub-millisecond retrieval.
* On critical operations (like `/refresh`), the client sends a `DPoP-Proof` JWT signed with their private key in the headers.
* The server imports the public key, verifies the signature, and matches the target HTTP Method (`htm`), target URI (`htu`), and timestamps (`iat` with a 30s skew tolerance).
* Replay attacks are prevented via a unique transaction identifier (`jti`) checked against and stored in Redis with a 60-second window.

### 2. Refresh Token Rotation (RTR) & Reuse Detection
* Every time `/refresh` is called, the current Refresh Token is rotated: the old token is invalidated, and a brand-new one is issued to the client.
* **Session Families**: All sessions are grouped into a "family" by a unique `familyId` when a login occurs.
* **Theft Detection**: If a rotated or invalid refresh token is used, it indicates token reuse (typically indicating that a malicious actor stole a token and either they or the victim are trying to use a previously exchanged token).
* **Automatic Lockdown**: Upon detecting token reuse, the server automatically invalidates the **entire session family** immediately:
  * Deletes all refresh keys (`rt:${userId}:${familyId}:${sid}`) from Redis.
  * Deletes all associated sessions for this family from the database.
  * Invalidates user profile cache.
  * Forces the client to log in again on all devices in that family.

### 3. Access Token Blacklisting
Because Access Tokens are stateless, they normally remain valid until expiration. When a user logs out via `/logout`, the system blacklists the Access Token (`blacklist:${accessToken}`) in Redis for its remaining lifespan (7 days), and the `isAuthenticated` middleware blocks any request bearing a blacklisted token.

---

## ⚡ Redis Key Registry

| Key Pattern | Purpose | TTL |
| :--- | :--- | :--- |
| `register-rate-limit:${ip}:${email}` | Registration rate limiter | 60 seconds |
| `verifyKey:${verifyToken}` | Temporary registration data container (holds hashed password & details until verified) | 300 seconds (5 mins) |
| `otp:${email}` | Login OTP code | 300 seconds (5 mins) |
| `login-otp-rate:${ip}:${email}` | Wrong OTP attempts tracker (max 5 attempts) | 300 seconds (5 mins) |
| `rt:${userId}:${familyId}:${sessionId}` | Active refresh token storage | 7 days |
| `family:${familyId}` | Redis Set of session IDs in the same login family | 7 days |
| `pubkey:${sessionId}` | Cached JWK public key for DPoP verification | 7 days |
| `dpop-jti:${jti}` | Unique DPoP transaction ID to prevent replays | 60 seconds |
| `user:${userId}` | Cached formatted user profile metadata | 300 seconds (5 mins) |
| `blacklist:${accessToken}` | Blacklisted access tokens (revoked on logout) | 7 days |

---

## ⚙ API Endpoint Registry

All auth routes are prefixed with `/api/v1/auth` (or as configured in the main Express router).

### 1. User Registration
* **Endpoint**: `POST /register`
* **Body Parameters**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  }
  ```
* **Process**:
  1. Validates body against `RegisterSchema` (Zod).
  2. Enforces registration rate limiting (60s).
  3. Checks if the email is already in the PostgreSQL DB.
  4. Hashes the password using `bcrypt` (12 rounds).
  5. Generates a cryptographically secure registration token.
  6. Stores the user details in Redis under `verifyKey:${token}` for 5 minutes.
  7. Sends a confirmation/verification email using Resend API containing the token link.

---

### 2. Confirm Email Registration
* **Endpoint**: `POST /verify/:token`
* **Path Parameters**: `token` (String)
* **Process**:
  1. Validates token format via Zod `ValidateRegisterSchema`.
  2. Fetches user details from Redis `verifyKey:${token}`.
  3. Checks again if the user has been created in DB in the meantime.
  4. Creates the permanent `User` record in PostgreSQL.
  5. Deletes the temporary registration token from Redis.

---

### 3. Login Attempt (Send OTP)
* **Endpoint**: `POST /login`
* **Body Parameters**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Process**:
  1. Validates input credentials using Zod `LoginSchema`.
  2. Verifies the user password via `bcrypt.compare`.
  3. Generates a random 6-digit numeric OTP code.
  4. Stores OTP code in Redis under `otp:${email}` (uses `NX` to prevent spam, 5-minute expiry).
  5. Dispatches an email with the login OTP code to the user's email address.

---

### 4. Verify Login OTP
* **Endpoint**: `POST /verifyLoginOTP`
* **Body Parameters**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "publicKeyJwk": { ... }, // Optional: Client-side JWK for DPoP
    "browser": "Chrome",
    "os": "Windows",
    "deviceType": "Desktop",
    "deviceName": "My Computer"
  }
  ```
* **Process**:
  1. Rate-limits requests (max 5 incorrect OTP attempts per 5 minutes per IP+email).
  2. Validates OTP against Redis `otp:${email}`.
  3. Deletes OTP and resets rate limit registry.
  4. Generates a unique `sessionId` and `familyId`.
  5. If `publicKeyJwk` is supplied, computes JWK thumbprint and stores JWK in Redis.
  6. Signs and issues JWTs:
     * Access token (15m, cookie).
     * Refresh token (7d, cookie + Redis).
  7. Records the active session details (user agent, IP, device specifications, public key thumbprint) in PostgreSQL `Session` table.

---

### 5. Refresh Tokens
* **Endpoint**: `POST /refresh`
* **Headers**: `DPoP-Proof` (Optional, required if DPoP was negotiated)
* **Process**:
  1. Extracts `refreshToken` cookie.
  2. Verifies signature & expiration of the refresh JWT.
  3. Fetches stored token from Redis under `rt:${userId}:${familyId}:${sessionId}`.
  4. **Reuse Check**: If token does not match or is missing, triggers reuse detection and deletes all session tokens in the family.
  5. **PoP Check**: If DPoP was negotiated, retrieves JWK from Redis, verifies signature, matching method/url, and ensures `jti` is unique.
  6. Rotates tokens: Deletes the old refresh token, generates a new one, signs a new access token, sets both cookies, and updates the DB session's token and expiry.

---

### 6. User Profile (Me)
* **Endpoint**: `POST /me`
* **Authentication**: Requires valid Access Token (`isAuthenticated` middleware).
* **Process**:
  1. Checks Redis cache `user:${userId}`.
  2. On miss, queries the database, caches profile in Redis (5-minute expiry), and returns user payload (avatar, email, username, name).

---

### 7. Session Manager (Active Sessions)
* **Endpoint**: `GET /sessions`
* **Authentication**: Requires valid Access Token.
* **Process**:
  1. Fetches all active, non-expired sessions from PostgreSQL for the authenticated user.
  2. Labels the active session that performed the request (`isCurrent = true`).
  3. Returns session array containing details like OS, browser, IP, location, and creation dates.

---

### 8. Revoke Specific Session
* **Endpoint**: `POST /revoke/:sessionId`
* **Authentication**: Requires valid Access Token.
* **Process**:
  1. Verifies that the requested session ID belongs to the authenticated user.
  2. Clears the refresh token (`rt:${userId}:${familyId}:${sessionId}`) and removes session ID from family set in Redis.
  3. Deletes the session row in the database.

---

### 9. Logout Single Device
* **Endpoint**: `POST /logout`
* **Authentication**: Requires valid Access Token.
* **Process**:
  1. Deletes current refresh token and removes session ID from family list in Redis.
  2. Places current access token on the Redis blacklist for its remaining validity duration (7 days).
  3. Deletes session from the database.
  4. Clears both `accessToken` and `refreshToken` cookies.

---

### 10. Logout All Devices
* **Endpoint**: `POST /logoutall`
* **Authentication**: Requires valid Access Token.
* **Process**:
  1. Retrieves all session IDs and families for the user from PostgreSQL.
  2. In Redis, deletes all refresh tokens and clears family sets.
  3. Deletes user cache profile in Redis.
  4. Deletes all session records from PostgreSQL.
  5. Clears cookies.

---

### 11. Profile Edition
* **Endpoint**: `POST /edit`
* **Authentication**: Requires valid Access Token.
* **Process**:
  1. Updates name, email, username, and avatar metadata in DB.
  2. Invalidates the Redis user cache (`user:${id}`).

---

### 12. Password Recovery (Forgot Password)
* **Endpoint**: `POST /forgot_password`
* **Body Parameters**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
* **Process**:
  1. Generates a random UUID token.
  2. Stores mapping `verifyKey:${token} -> email` in Redis with 1-hour expiry.
  3. Dispatches password recovery email using Resend with the recovery link.