# Multi-Tenant Clinic Management SaaS Platform

A modern, high-performance, multi-tenant healthcare software-as-a-service (SaaS) platform built with Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

---

## 🚀 Overview

This platform enables independent clinics and multi-specialty hospitals to register, manage departments, provision individual physician accounts, generate branded QR codes for touchless patient self check-in, and maintain strictly isolated electronic health records.

### ✨ Implemented Phases

#### 🏥 Phase 1: Clinic Registration & Tenant Isolation
- **Clinic Onboarding**: Comprehensive facility registration with auto-generated sequential Clinic IDs (`QNX-CLN-000001`, `QNX-CLN-000002`).
- **Database Architecture**: Shared PostgreSQL database with row-level tenant isolation keyed by `clinic_id`.
- **Security & RBAC**: BCrypt password hashing, signed JWT HTTP-only cookies, sliding-window rate limiting, and structured audit logs.
- **Clinic Dashboard**: Administrative overview of clinic facility status, contact details, and configuration settings.

#### 🩺 Phase 2: Clinic Dashboard & Doctor Management
- **Doctor Directory**: Full CRUD with auto-generated Doctor IDs (`DOC-000001`, `DOC-000002`), department assignments, consultation fees, and profile management.
- **Department Management**: Clinical specialty creation with safe deletion constraints (preventing deletion of active departments with assigned doctors).
- **Physician Portal**: Dedicated `/doctor/dashboard` with independent physician logins and self-profile updates.
- **Role Management**: Granular permissions across `OWNER`, `ADMIN`, `DOCTOR`, and `RECEPTIONIST`.

#### 📱 Phase 3: Patient Registration & QR Code Management
- **Touchless Patient Self Check-In**: Unique QR code generated for each clinic linking to `/register-patient/[qrSlug]`.
- **Unique Patient IDs**: Sequential, collision-free Patient IDs per clinic (`PAT-CLN000001-000001`, `PAT-CLN000001-000002`).
- **Returning Patient Detection**: Mobile number lookup within clinic tenant boundary.
- **SMS OTP Verification**: Accessible single-input 6-digit numeric OTP verification conforming to modern web standards (`autocomplete="one-time-code"`, `inputmode="numeric"`, `pattern="\d{6}"`, and WebOTP API progressive enhancement).
- **Patient Directory & Visits**: Chronological visit history tracking (`QR_CODE` vs `RECEPTION_DESK`), profile editing, and walk-in front desk registration.
- **Reception Standee Generator**: One-click printable display poster and PNG download for clinic counters.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma ORM 5.22)
- **Authentication**: JWT in secure `HttpOnly` cookies, BCrypt password hashing
- **QR Code**: `qrcode` library with vector/high-res PNG generation
- **Icons**: Lucide React
- **Validation**: Zod schema validation

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL database (Local, Neon, Supabase, or AWS RDS)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Ashwin-876/clinic-management-saas.git
   cd clinic-management-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and JWT_SECRET with your credentials
   ```

4. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

The repository includes comprehensive automated test suites covering unit logic, tenant isolation, and HTTP API endpoints:

```bash
# Phase 1 tests (Clinic registration, tenant isolation, auth)
npx tsx scripts/test-phase1.ts

# Phase 2 unit & E2E tests (Doctor management, departments, RBAC)
npx tsx scripts/test-phase2.ts
npx tsx scripts/test-phase2-e2e.ts

# Phase 3 unit & E2E tests (Patient ID sequence, OTP lifecycle, QR code)
npx tsx scripts/test-phase3.ts
npx tsx scripts/test-phase3-e2e.ts
```

---

## 📄 License
MIT License.
