# ClinicIQ 

> **Course:** CSC 59866 — Senior Project  
> **Instructor:** Prof. Thomas M. Sessa  
> **Institution:** CUNY – The City College of New York  
> **Semester:** Fall 2025 – Spring 2026  
> **Team:** Digital Worms

---

## Team Members

| Name |
|---|
| Ethan Nghiem | 
| YiXuan Shi | 
| Kelvin Bermejo | 
| Munjer Masrur | 
| Kritan Baniya | 

---

## Project Overview

**ClinicIQ** is a web-based clinic queue and appointment management platform designed to reduce patient wait times, eliminate paper-based check-ins, and unify the workflow for clinic staff. Patients can remotely join a queue, complete intake forms, view their real-time queue position, and schedule appointments — all from a browser. Clinic staff (nurses, doctors, and administrators) each receive a role-specific dashboard with real-time synchronization powered by Supabase.

The system is built to be clinic-agnostic and can be adopted by any outpatient clinic.

---

## Features by Role

### Patient
- **Clinic Discovery** — Browse approved clinics on an interactive map (MapLibre GL + MapTiler). Search by name; optionally share location to surface nearby clinics first.
- **Queue Management** — Join a clinic queue (enters as `pending`), view real-time queue position, and leave the queue.
- **Appointment Manager** — Request future appointments with a selected clinic and doctor; view the full appointment list; check in for eligible scheduled appointments.
- **Form Submission** — Download clinic-provided fillable PDFs, fill them out, and upload them back through the patient portal (stored in Supabase Storage).
- **Visit Summary** — View doctor-written visit notes, diagnoses, symptoms, and treatment plans from all past visits.
- **Lab Results & Prescriptions** — Access uploaded lab test results and prescriptions from their dashboard.
- **Profile Management** — Update personal information.

### Nurse
- **Clinic Invitations** — Receive clinic invitations from admins; accept or decline them.
- **Queue Management** (permission-gated) — With `manage_queue` permission: approve pending patients into the active queue, reorder waiting patients, call patients, start visits, mark no-shows, complete visits, and assign a doctor to a queue entry. All changes are reflected instantly via Supabase Realtime.
- **Appointment Manager** — Create, edit, and update appointments; assign practitioners. View appointments as a **calendar** (month/week/day) or a **filterable list** (filter by patient name, status, visit type, practitioner, date range).
- **PDF Upload** — Upload clinic intake forms (PDFs) for patients to download and complete.

### Doctor
- **Patient Queue** — View all queue entries assigned to the doctor; access full patient files during consultation.
- **Clinical Notes** — Write visit summaries documenting symptoms, diagnoses, and treatment plans.
- **Lab Results & Prescriptions** — Upload lab results and prescriptions linked to a patient visit; reference these in future consultations.

### Clinic Admin
- **Profile Setup** — Create and manage an admin profile.
- **Clinic Creation** — Create a clinic with name, specialty, phone, email, website, description, and address. Address lookup is powered by the Google Places API with geocoding (lat/lng, place ID). New clinics start as `pending` until approved by a System Admin.
- **Clinic Management** — Edit clinic details after approval; view clinic overview and submitted information while pending.
- **Staff Management** — Add nurses/doctors by email (nurses receive a pending invitation via `staff_permissions`); remove staff; grant or revoke the `manage_queue` permission for nurses.

### System Admin
- **Clinic Approvals** — View all registered clinics; filter by approval status; see associated clinic admin details; approve or revoke clinic approval. System admin status is enforced at the database layer — it cannot be self-assigned via the public signup flow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | TailwindCSS 4 + ShadCN UI |
| Icons | Lucide React |
| Routing | React Router v7 |
| Forms | React Hook Form |
| Calendar | React Big Calendar |
| Map | MapLibre GL + MapTiler |
| Address Lookup | Google Places API |
| PDF Handling | @react-pdf-viewer/core |
| Date Utilities | date-fns |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Realtime | Supabase Realtime (websocket subscriptions) |
| File Storage | Supabase Storage (PDF bucket) |
| Deployment | Vercel (frontend) + Supabase Cloud (backend) |
| Prototyping | Figma |

---

## Database Schema (Supabase / PostgreSQL)

### Core Tables

| Table | Description |
|---|---|
| `profiles` | All users — stores role (`patient`, `nurse`, `doctor`, `clinic_admin`), name, and auth link |
| `clinics` | Clinic details — name, specialty, contact info, address, geocoords, approval status |
| `clinic_admin` | Links a clinic admin profile to their clinic |
| `Memberships` | Tracks clinic membership for all user types |
| `staff_permissions` | Nurse-to-clinic permission records including `manage_queue` flag and invitation status |
| `queue_entries` | Individual queue entries with status (`pending`, `waiting`, `called`, `in_progress`, `completed`, `cancelled`, `left`, `no_show`) and ordering |
| `Queues` | Queue metadata per clinic |
| `Appointments` | Appointment records with status (`pending`, `unseen`, `canceled`, `deserted`, `active`, `completed`) |
| `appt_creation_requests` | Appointment creation request tracking |
| `patient_info` | Extended patient profile data |
| `nurse_info` | Nurse license type and credentials (`RN`, `LPN`, `LVN`, `NP`) |
| `doctor_info` | Doctor profile data |
| `practicioner_info` | Shared practitioner reference table |
| `medical_history` | Patient medical history records |
| `lab_results` | Lab test result records uploaded by doctors |
| `prescriptions` | Prescription records linked to visits |

### Key Database Features
- **Row-Level Security (RLS)** on every table — access is scoped by role, clinic membership, and permission flags.
- **PostgreSQL triggers** — auto-sync clinic admin membership on clinic status changes, auto-create memberships on appointment insert, auto-remove nurse memberships on staff deletion.
- **RPC functions** — server-side business logic for queue state transitions (`accept_pending_queue_entry`, `assign_queue_entry_doctor`, `complete_visit`, etc.), appointment creation/update, and queue statistics.
- **Realtime subscriptions** — nurses and patients receive live queue updates without polling.
- **Fuzzy search** — `pg_trgm`-based clinic name search via the `fuzzy_clinics` migration.
- **Rate limiting** — database-level rate limiting on sensitive operations.

---

## Project Structure

```
Senior-Project/
├── frontend/                    # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx              # Route definitions & providers
│   │   ├── context/
│   │   │   ├── AuthContext.tsx  # Auth state & current user
│   │   │   └── ClinicContext.tsx# Selected clinic state
│   │   ├── layouts/
│   │   │   ├── RootLayout.tsx
│   │   │   ├── DashboardGuard.tsx  # Redirects unauthenticated users
│   │   │   └── RoleGuard.tsx       # Enforces role-based route access
│   │   ├── pages/
│   │   │   ├── HomeGate.tsx         # Redirects to role-appropriate dashboard
│   │   │   ├── HomePage.tsx
│   │   │   ├── ClinicInfo.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── Support.tsx
│   │   │   ├── Form/
│   │   │   │   ├── PatientPDFUpload.tsx
│   │   │   │   ├── ClinicPDFUpload.tsx
│   │   │   │   └── PatientFormView.tsx
│   │   │   └── Dashboard/
│   │   │       ├── Patient/         # Patient portal pages
│   │   │       ├── Nurse/           # Nurse dashboard pages
│   │   │       ├── Doctor/          # Doctor dashboard pages
│   │   │       ├── Clinic/          # Clinic admin pages
│   │   │       └── SystemAdmin/     # System admin pages
│   │   ├── features/
│   │   │   ├── queue/               # Queue components, hooks, realtime, API
│   │   │   ├── appointment/         # Appointment calendar, list, modals, API
│   │   │   └── medical/             # Lab results, prescriptions, history APIs
│   │   ├── components/
│   │   │   ├── ui/                  # ShadCN UI primitives
│   │   │   └── ...                  # Shared components
│   │   ├── lib/
│   │   │   ├── supabase.ts          # Supabase client
│   │   │   ├── googlePlaces.ts      # Google Places API integration
│   │   │   ├── getHomePath.ts       # Role → dashboard path mapping
│   │   │   └── utils.ts
│   │   └── hooks/
│   │       └── use-mobile.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
├── supabase/
│   ├── config.toml               # Local Supabase project config
│   └── migrations/               # Ordered SQL migration files
├── scripts/
│   └── seed-auth-users.mjs       # Auth user seeding script for local dev
└── README.md
```

---

## Prerequisites

Make sure the following are installed before you begin:

- **Git** — `git --version`
- **Node.js v18+** — `node --version` ([download](https://nodejs.org/en/download))
- **Supabase CLI** — included via `npx supabase` (or install globally with `npm i -g supabase`)
- **Docker** — required to run Supabase locally ([download](https://www.docker.com/products/docker-desktop/))

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory. Use the template below:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# MapTiler (map tile rendering)
VITE_MAPTILER_KEY=your_maptiler_key_here

# Google Maps (clinic address autocomplete)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Enable HTTPS in dev (required for some browser APIs)
VITE_HTTPS=true
```

For **local development**, replace the Supabase values with the local instance credentials printed by `npx supabase start`.

---

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone <repository-url>
cd Senior-Project
```

### 2. Start the local Supabase instance

> Docker must be running before this step.

```bash
npx supabase start
```

This spins up a local PostgreSQL database, Supabase Auth, Realtime, and Storage. After it starts, copy the printed `API URL` and `anon key` into your `.env.local`.

### 3. Apply migrations and seed the database

```bash
# Apply all migrations and re-seed the database
npx supabase db reset

# Seed authentication users (requires .env.local to be set)
node --env-file=.env.local scripts/seed-auth-users.mjs
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `https://localhost:5173` (HTTPS is enabled by `vite-plugin-mkcert`).

---

## Local Database Workflow

### Create a new migration

```bash
npx supabase migration new <descriptive-name>
```

This creates a timestamped `.sql` file under `supabase/migrations/`. Write your SQL there, then run `npx supabase db reset` to apply it.

### Reset and reseed the database

```bash
npx supabase db reset
node --env-file=.env.local scripts/seed-auth-users.mjs
```

---

## Deployment

### Frontend — Vercel

The frontend is deployed to Vercel with continuous deployment from the GitHub repository. Any push to the main branch triggers an automatic build and deploy.

Set the following environment variables in the Vercel project settings (matching your production Supabase project):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_MAPTILER_KEY
VITE_GOOGLE_MAPS_API_KEY
VITE_HTTPS
```

### Backend — Supabase Cloud

The production backend runs on Supabase Cloud. Migrations are applied to the remote project via:

```bash
npx supabase db push
```

---

## Architecture Overview

```
Browser (React SPA on Vercel)
        │
        ├── Supabase Auth        ← JWT-based authentication
        ├── Supabase PostgREST   ← REST API auto-generated from PostgreSQL tables
        ├── Supabase RPC         ← Custom server-side functions (queue transitions, appointments)
        ├── Supabase Realtime    ← WebSocket subscriptions for live queue updates
        └── Supabase Storage     ← PDF file uploads (intake forms, lab results)
```

All business logic lives close to the database via PostgreSQL triggers, RPC functions, and Row-Level Security policies. The frontend calls Supabase directly through the `@supabase/supabase-js` SDK — there is no separate API server.

---

## Future Work

- **ML-based wait time prediction** — replace the current average-based estimate with a machine learning model trained on historical queue data.
- **Analytics dashboard** — operational metrics for clinic admins (average wait time, no-show rate, throughput by time of day).
- **AI assistant** — interactive patient support chatbot.
- **Structured intake forms** — replace PDF uploads with dynamic in-browser forms whose responses are stored in structured database tables.
- **Inventory & resource tracking** — extend the clinic admin panel with resource and supply management.
- **Native mobile apps** — iOS/Android companions for patient-facing features.
