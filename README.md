# ResolveHub

Full-stack apartment service request tracking for tenants, technicians, managers, and admins.

## Stack

- Frontend: React 18, Vite, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT auth
- Deployment: Vercel frontend proxy, PM2/backend process config, Dockerfiles

## Structure

```text
.
├── campus-frontend/             # React app and Vercel proxy
├── campus-service-backend/      # Express API, models, controllers, tests
├── SECURITY.md
└── LICENSE
```

## Local Development

Start the backend:

```bash
cd campus-service-backend
npm install
cp .env.example .env
npm run dev
```

Start the frontend:

```bash
cd campus-frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Backend Env

Create `campus-service-backend/.env`:

```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/apartmentdb
PORT=5000
JWT_SECRET=change_this_in_production
JWT_EXPIRES=7d
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=info
```

## API

Base prefix: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/create-user`
- `GET /api/auth/technicians`
- `GET /api/auth/all`
- `GET /api/complaints`
- `POST /api/complaints`
- `PUT /api/complaints/assign/:id`
- `PUT /api/complaints/status/:id`
- `PUT /api/complaints/priority/:id`
- `DELETE /api/complaints/:id`
- `GET /api/admin/analytics`
- `GET /api/audit`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `GET /health`

## Docker

```bash
docker build -t resolvehub-frontend ./campus-frontend
docker build -t resolvehub-backend ./campus-service-backend
```

## License

MIT. See [LICENSE](./LICENSE).
