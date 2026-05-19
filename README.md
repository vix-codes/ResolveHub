# ResolveHub

A production-oriented full-stack platform for handling apartment maintenance/service requests from submission to closure.

It provides:
- **Tenant self-service** request creation with evidence images and auto-generated tracking tokens.
- **Manager/Admin operations** for assignment, prioritization, and analytics.
- **Technician workflow** for progress updates and completion.
- **Auditability + notifications** so every action is trackable and stakeholders are informed.

---

## What this project does

This system helps apartment communities run a complete maintenance lifecycle:

1. **Tenant raises a request** (e.g., plumbing leak, power issue).
2. **System auto-prioritizes** by keywords and assigns a unique token like `APT-2026-0001`.
3. **Manager/Admin assigns** the request to a technician.
4. **Technician updates status** (`ASSIGNED` → `IN_PROGRESS` → `COMPLETED`/`REJECTED`).
5. **System records action logs + notifications** for accountability.
6. **Admin/Manager monitors analytics** for throughput, resolution time, and workload.

---

## Tech stack

### Frontend (`campus-frontend`)
- React 18 + Vite
- React Router
- Axios
- Role-based dashboards (tenant / technician / manager / admin)

### Backend (`campus-service-backend`)
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication + role-based authorization
- Structured logging and security middleware

### Deployment
- Docker + Docker Compose
- Vercel-ready frontend setup
- Railway-friendly backend root scripts

---

## Core features

- **Authentication & Roles:** tenant, technician, manager, admin.
- **Complaint/Request lifecycle:** create, assign, status transitions, delete.
- **Priority engine:** keyword-driven priority hints (`low` to `critical`).
- **Notifications:** assignment and update alerts with read/unread state.
- **Audit logs:** action history by complaint, user, and action type.
- **Analytics endpoint:** overview and technician performance for admin/manager.
- **Health endpoint:** `/health` for operations checks.

---

## Repository structure

```text
.
├── campus-frontend/             # React app
├── campus-service-backend/      # Express API + MongoDB models/controllers/routes
├── docker-compose.yml           # Local full-stack orchestration
├── Dockerfile                   # Root container/deploy helper
├── SECURITY.md                  # Security policy notes
├── LICENSE                      # MIT License (added)
└── MIT_LICENSE.md               # Plain-language MIT summary (added)
```

---

## Quick start (local)

### 1) Start backend

```bash
cd campus-service-backend
npm install
cp .env.example .env
npm run dev
```

### 2) Start frontend

```bash
cd campus-frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## Environment variables (backend)

Create `campus-service-backend/.env` with at least:

```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/apartmentdb
PORT=5000
JWT_SECRET=change_this_in_production
JWT_EXPIRES=7d
RATE_LIMIT_MAX=100
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=info
```

---

## API overview

Base prefix: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/create-user` (auth)
- `GET /api/auth/technicians` (auth)
- `GET /api/auth/all` (auth)

- `GET /api/complaints` (auth)
- `POST /api/complaints` (auth)
- `PUT /api/complaints/assign/:id` (auth)
- `PUT /api/complaints/status/:id` (auth)
- `PUT /api/complaints/priority/:id` (auth)
- `DELETE /api/complaints/:id` (auth)

- `GET /api/admin/analytics` (auth)
- `GET /api/audit` (auth)
- `GET /api/audit/user/:userId` (auth)
- `GET /api/audit/action/:action` (auth)
- `GET /api/audit/complaint/:complaintId` (auth)

- `GET /api/notifications` (auth)
- `PUT /api/notifications/:id/read` (auth)

- `GET /health`

---

## Run with Docker

From repository root:

```bash
docker-compose up --build
```

---

## Security highlights

- Configurable CORS policy
- JWT-protected private routes
- Request logging + centralized error handling
- Input limits and sanitization dependencies are present in backend stack

See `SECURITY.md` for policy and guidance.

---

## License

This project is licensed under the **MIT License**.

- Full legal text: [LICENSE](./LICENSE)
- Friendly explanation: [MIT_LICENSE.md](./MIT_LICENSE.md)

