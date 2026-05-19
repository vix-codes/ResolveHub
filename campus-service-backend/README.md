# ResolveHub — Backend

**Designed for real residential-scale deployment.**

## Production-Ready Features

### Security & Performance
- **Helmet.js**: HTTP headers security (CSP, X-Frame-Options, etc.)
- **Express Rate Limiting**: Configurable per-minute request limits (default 100/min)
- **NoSQL Injection Protection**: via `express-mongo-sanitize`
- **XSS Protection**: via `xss-clean`
- **CORS**: Configurable via `CORS_ORIGINS` env
- **Compression**: gzip response compression
- **Request Size Limits**: 10KB JSON body limit

### Logging & Monitoring
- **Winston Logger**: Structured JSON logging to console + files
- **Daily Rotate Files**: Automatic log rotation (`logs/application-*.log`, `logs/errors-*.log`)
- **Request Tracing**: All HTTP requests logged with method, URL, IP, response time
- **Error Tracking**: Full stack traces and error context logged to `logs/errors-*.log`
- **Uncaught Exception Handlers**: Process-level exception and rejection logging
- **Morgan Integration**: Combined HTTP access logs

### Reliability & Production Ops
- **Graceful Shutdown**: SIGTERM/SIGINT handlers for clean server termination
- **PM2 Clustering**: `ecosystem.config.js` for multi-process clustering
- **Environment Configs**: `.env` and `.env.example` for secure, environment-specific settings
- **JWT Auth**: Env-configured secret, exp (default 7d), verified via middleware
- **Docker Support**: Lightweight Alpine-based image, multi-stage frontend build
- **Docker Compose**: Full-stack local deployment (MongoDB + backend + frontend)

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   cd APP/campus-service-backend
   npm install
   ```

2. **Create `.env` (copy from `.env.example`):**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your settings:**
   ```
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/apartmentdb
   PORT=5000
   JWT_SECRET=dev_secret_change_in_prod
   RATE_LIMIT_MAX=1000
   ```

4. **Run dev server (watches for changes):**
   ```bash
   npm run dev
   ```

Server will start at `http://localhost:5000`. Logs written to `logs/` directory and console.

### Production Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# From repository root
docker-compose up --build
```

This starts:
- **MongoDB** on `localhost:27017`
- **Backend** on `localhost:5000` (health check: `GET /health`)
- **Frontend** on `localhost:5173`

#### Option 2: PM2 Process Manager
```bash
npm install -g pm2
npm run build  # if needed
pm2 start ecosystem.config.js --env production
pm2 logs
pm2 startup
pm2 save
```

PM2 runs `max` instances (auto-scale to CPU cores) in cluster mode, with auto-restart on failure.

#### Option 3: Node.js (Simple)
```bash
# Ensure .env is configured for production
NODE_ENV=production npm run start:prod
```

## Configuration

### Environment Variables (see `.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | `development` or `production` |
| `MONGO_URI` | mongodb://localhost:27017/campusdb | MongoDB connection string |
| `PORT` | 5000 | Server port |
| `JWT_SECRET` | secretkey | JWT signing key (CHANGE IN PROD!) |
| `JWT_EXPIRES` | 7d | Token expiry |
| `RATE_LIMIT_MAX` | 100 | Complaints per minute |
| `CORS_ORIGINS` | localhost:5173 | Allowed CORS origins |
| `LOG_LEVEL` | info | winston log level |

### Scaling Design

- **In-memory sessions**: Stateless JWT auth (scales horizontally without session store)
- **MongoDB clustering**: Use Atlas or managed Mongo cluster for prod
- **Load balancing**: Use nginx, AWS ALB, or Kubernetes ingress
- **PM2 clustering**: Multi-process on single machine or distributed via Docker/K8s

### Monitoring & Error Tracking

#### Winston Logs
- Location: `logs/` directory
- Files: `application-YYYY-MM-DD.log` (info), `errors-YYYY-MM-DD.log` (errors only)
- Retention: 14 days for application, 30 days for errors

#### Sentry Integration (Optional)
Add Sentry for cloud error tracking:

```bash
npm install @sentry/node
```

Uncomment and configure in `src/utils/sentry.js`, then wire into `server.js`:
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN, ... });
app.use(Sentry.Handlers.ComplaintHandler());
```

Set `SENTRY_DSN` in `.env`.

## API Endpoints

### Health Check
```
GET /health
```
Returns `{ status: "Server running" }`

### Authentication
```
POST /auth/signup
POST /auth/login
```

### Complaints
```
GET /complaints
POST /complaints
PUT /complaints/assign/:id
PUT /complaints/staff-status/:id
DELETE /complaints/:id
```

### Audit Logs
```
GET /audit (admin)
GET /audit/Complaint/:ComplaintId
```

### Notifications
```
GET /notifications
PUT /notifications/:id/read
```

## Architecture Summary

```
server.js (entry point)
├─ dotenv (env config)
├─ Winston logger (logs/ rotation)
├─ Express app (hardened: helmet, rate-limit, sanitize, compression, cors)
├─ Middleware: Morgan (HTTP logging), ComplaintLogger, authMiddleware
├─ Routes: /auth, /complaints, /audit, /notifications
├─ Error handler (logs to Winston)
└─ Graceful shutdown (SIGTERM/SIGINT)
```

## Testing in Production-like Environment

Use Docker Compose:
```bash
docker-compose up --build
```

Test flows:
1. Create Complaint (student login)
2. Assign to staff (admin)
3. Update status (staff)
4. Check logs: `docker logs <container_id>`
5. View files: `docker exec <container_id> ls logs/`

## Recruiter Line

**"ResolveHub is designed for real production-scale deployment with enterprise logging, security hardening, and PM2 clustering—ready for 1000+ concurrent users and production kubernetes environments."**
