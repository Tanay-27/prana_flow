# 🌿 Software Name (Final Recommendation)
**PranaFlow**  
_A personal healing workspace for sessions, protocols, and growth._

---

# 📘 PranaFlow – Updated Implementation Plan (Incorporating Clarifications)

## 1. Refined Product Definition

PranaFlow is a **personal, self-hosted, mobile-first healing management system** designed for **individual healers**.  
Each healer is effectively a **user with isolated data** (no shared tenancy), even if multiple healers exist in the system later.

Key assumption reinforced:
- This is **not a SaaS**.
- No regulatory, compliance, or multi-org complexity.
- Optimized for **clarity, speed, and daily usability**, not extensibility theatre.

---

## 2. User & Role Model (Simplified)

### Roles
1. **Admin (Healer / Owner)**
   - Full access to **all data**
   - Can create other users (healers)
   - Can delete records (exclusive)

2. **User (Healer / Client-equivalent)**
   - Can only see **their own data**
   - Mostly read-only views
   - Explicit edit actions via buttons (no inline free editing)

> 🔑 **Important Design Choice**
- Treat **healers == users**
- Clients are **entities managed by a healer**, not system users by default

---

## 3. Core Functional Modules

### 3.1 Client Management
- CRUD clients
- Client profile contains:
  - Basic info
  - Photo
  - Healing notes (timestamped, append-only preferred) We can attach protocol from the list for a client . (multiple protocols can be attached)
  - Session history (derived)
  - Payment history (derived)

> 💡 Suggestion:  
Avoid deleting clients physically → use `is_active` flag to preserve history integrity.
[Accepted, implement this]
---

### 3.2 Session Scheduling & Agenda (Key Module)

#### Session Types
- **Healing Session** (linked to a client)
- **Nurturing Session** (self-learning)

#### Scheduling Model (As clarified)
- User selects:
  - Days of week
  - Time
  - Start date
  - End date
- System auto-applies sessions **weekly until end date**
- No complex recurrence rules, exceptions, or overrides

#### Views
- **Agenda-based calendar**, not month grid
  - Today
  - Tomorrow
  - Next 7 days
- Daily summary:
  - Number of healings
  - Time spent (optional)

---

### 3.3 Payments (INR Only)
Payments are tracked **per healing session**.

#### Payment Capabilities
- INR currency only
- One or more payments per session (optional)
- Fields:
  - Amount
  - Mode (Cash / UPI / Bank)
  - Status (Paid / Pending)
  - Date

> ⚠️ Blocker Avoided  
Do **not** embed payments inside sessions → keep separate collection for clean reporting.

---

### 3.4 Healing Protocol Management (Simple & Intentional)

No versioning. No approval flows.

#### Features
- CRUD protocols
- Search by:
  - Name
  - Keywords
- Rich text notes
- Attachments:
  - PDFs
  - Images

#### Fields
- Protocol Name
- Text Notes
- Keywords / Tags
- Attachments
- Updated At

---

### 3.5 Nurturing Sessions (Learning Tracker)

Used to track workshops, courses, healing events attended or planned.

#### Fields (As Required)
- Session Name
- Session Date
- Session Coordinator
- Payment Details
- Status:
  - Planned
  - Registered
  - Attended
- Recording Available Till (date)
- Attachments:
  - PDFs
  - Images
  - Notes

---

## 4. Database Design (Concrete & Minimal)

### Chosen DB
**MongoDB** – single database, multiple collections

### Core Collections
1. `users`
2. `clients`
3. `sessions`
4. `payments`
5. `protocols`
6. `nurturing_sessions`
7. `attachments`

---

### Key Schema Decisions

#### sessions
- `_id`
- `type` → healing | nurturing
- `user_id` (healer owner)
- `client_id` (nullable)
- `protocol_ids[]`
- `scheduled_date`
- `start_time`
- `end_time`
- `status`
- `notes`

#### payments
- `_id`
- `session_id`
- `client_id`
- `amount_inr`
- `mode`
- `status`
- `paid_at`

> ✔️ This structure avoids overloading documents and keeps querying simple.

---

## 5. File & Attachment Storage

### Recommended Approach
- External object storage (S3-compatible or local MinIO)
- DB stores:
  - file URL
  - file type
  - linked entity ID

> Since this is personal/self-hosted, **MinIO + Docker** is a very strong fit.

---

## 6. UI / UX Design Principles (Mobile First)

### Core Principles
- Large typography
- High contrast
- Minimal density
- Explicit actions (Edit button → Edit mode)

### Navigation
- Bottom tab navigation (mobile)
- Sidebar (desktop)

### Key Screens
1. Login
2. Dashboard (Agenda view)
3. Clients
4. Sessions
5. Protocols
6. Nurturing Sessions

> ❗Avoid inline editing everywhere.  
Every edit should be intentional.

---

## 7. Technology Stack

### Frontend
- React + TypeScript
- Mobile-first CSS (Tailwind or Mantine)
- PWA-ready but **offline disabled in v1**

### Backend
- Node.js + NestJS
- REST APIs
- JWT authentication

### Database
- MongoDB

### File Storage
- MinIO (Dockerized)
- Local filesystem fallback (optional)

---

## 8. Docker & Deployment (Mandatory)

### Dockerized Services
- frontend
- backend
- mongodb
- minio
- nginx

### Nginx Responsibilities
- Reverse proxy
- TLS termination (optional)
- Static frontend hosting
- API routing

> 🎯 Goal:  
`docker compose up` → system running on static IP

---

## 9. Explicitly Out of Scope (For Now)
- Offline support
- Notifications
- Analytics dashboards
- Multi-currency
- Protocol versioning
- Phase 3 expansions

This keeps the product **buildable, finishable, and usable**.

---

## 10. Remaining Minor Clarifications (Optional)
Not blockers, but useful to decide early:
1. Should nurturing sessions appear in the same agenda view as healing sessions? [Answer: YES]
2. Should clients ever log in, or remain entities only? [Answer: NO, entities only. client will never login]
3. Should attachments be downloadable or view-only? [Answer: VIEW ONLY]

---

## 11. Final Architectural Summary

PranaFlow is:
- Personal
- Opinionated
- Mobile-first
- Docker-native
- Agenda-driven
- Low cognitive load

If you want, next steps could be:
- Mongo schema definitions
- REST API contract
- Wireframe sketches
- Folder structure
- `docker-compose.yml` draft

This plan is **build-ready**, not aspirational.
