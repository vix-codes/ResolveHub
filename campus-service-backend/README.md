# ResolveHub Backend

Express API for apartment service requests.

## Features

- JWT authentication with tenant, technician, manager, and admin roles
- Complaint lifecycle routes for create, assign, status, priority, and delete
- Notifications and audit logs
- Helmet, compression, CORS, rate limiting, request logging, and sanitization
- PM2 config and Dockerfile for production deployment

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

The server runs on `http://localhost:5000`.

## Production

Run with PM2:

```bash
pm2 start ecosystem.config.js --env production
pm2 logs
pm2 save
```

Or build the backend Docker image:

```bash
docker build -t resolvehub-backend .
```

## Environment

See `.env.example`.

Key variables:

- `MONGO_URI`
- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES`
- `CORS_ORIGINS`
- `APP_BASE_PATH`
- `LOG_LEVEL`

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
- `GET /api/audit`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `GET /health`

When `APP_BASE_PATH=/apartment`, the backend also serves `/apartment/api/*` and `/apartment/health`.

## Tests

```bash
npm test
```
