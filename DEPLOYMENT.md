# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Environment variables configured
- Database backups in place

## Development Environment

### Quick Start
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Setup
Create `.env` file:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=sqlite:./db.sqlite
JWT_SECRET=dev-secret-key
FRONTEND_URL=http://localhost:3000
```

## Staging Environment

### Docker Build
```bash
# Build images
docker-compose build

# Run services
docker-compose up -d

# Check health
curl http://localhost:4000/api/health
curl http://localhost:3000
```

### Database Setup
```bash
# PostgreSQL connection
POSTGRES_URL=postgresql://user:password@postgres:5432/canary_db
```

## Production Deployment

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Type checking passes
- [ ] No security vulnerabilities
- [ ] Environment variables configured
- [ ] Database backups scheduled
- [ ] Monitoring setup
- [ ] Error tracking configured

### Configuration

#### Environment Variables (.env)
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/db_name
JWT_SECRET=<secure-random-secret-key>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://app.canary.dev
CORS_ORIGINS=https://app.canary.dev

# Optional services
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Database Migration

```bash
# Create migration
pnpm -F @canary/backend run typeorm migration:generate

# Run migration
pnpm -F @canary/backend run typeorm migration:run

# Revert migration
pnpm -F @canary/backend run typeorm migration:revert
```

### Build & Deploy

```bash
# Build images
docker build -t canary-frontend:latest ./apps/frontend
docker build -t canary-backend:latest ./apps/backend

# Push to registry
docker push your-registry/canary-frontend:latest
docker push your-registry/canary-backend:latest

# Pull and run
docker pull your-registry/canary-backend:latest
docker pull your-registry/canary-frontend:latest

# Start with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

```bash
# API health
curl https://api.canary.dev/api/health

# Database connectivity
curl https://api.canary.dev/api/health

# Frontend
curl https://app.canary.dev
```

## Scaling

### Horizontal Scaling (Multiple Instances)

Use load balancer (nginx, HAProxy, or cloud provider):
```nginx
upstream backend {
    server backend-1:4000;
    server backend-2:4000;
    server backend-3:4000;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://backend;
    }
}
```

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Connection pooling
-- Use PgBouncer or similar
```

## Monitoring

### Application Monitoring
- Set up Sentry for error tracking
- Configure DataDog or similar for metrics
- Set up uptime monitoring

### Database Monitoring
- Monitor query performance
- Set up automated backups
- Monitor disk space

### Log Aggregation
```bash
# Send logs to centralized service
# Examples: ELK Stack, Loki, CloudWatch
```

## Backup & Recovery

### Database Backups
```bash
# PostgreSQL backup
pg_dump canary_db > backup_$(date +%Y%m%d).sql

# Automated backup (cron job)
0 2 * * * pg_dump canary_db | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Restore
psql canary_db < backup_file.sql
```

### File Backups
- Upload volumes to cloud storage
- Set retention policies
- Test recovery procedures

## Security Hardening

### HTTPS/TLS
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

### Rate Limiting
```typescript
// In NestJS
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per 60 seconds
getUsers() { }
```

### CORS Configuration
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
```

### Security Headers
```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## Rollback Procedure

```bash
# Keep previous versions tagged
docker tag canary-backend:current canary-backend:v1.0.0

# Rollback to previous version
docker-compose down
docker-compose up -d canary-backend:v1.0.0
```

## Performance Optimization

### Frontend
- Enable Turbopack caching
- Implement Service Workers
- Use CDN for static assets
- Enable compression

### Backend
- Enable query result caching
- Use Redis for session storage
- Implement database connection pooling
- Use async processing for long operations

## Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 5 minutes

### Steps
1. Restore from latest backup
2. Verify data integrity
3. Run migrations if needed
4. Update DNS/routing
5. Monitor for errors
6. Notify stakeholders

## Maintenance Windows

### Zero-downtime Deployment
```bash
# Deploy new version to separate containers
docker-compose -f docker-compose.new.yml up -d

# Run migrations
docker exec canary-backend npm run migration:run

# Switch traffic to new version (using load balancer)
# Keep old version running as fallback

# After verification, remove old version
docker-compose -f docker-compose.old.yml down
```

## Support & Troubleshooting

### Common Issues

**High Memory Usage**
```bash
# Check container memory
docker stats

# Limit container memory
docker-compose down
# Edit docker-compose.yml with memory limits
docker-compose up -d
```

**Database Connection Issues**
```bash
# Check database
docker exec canary-postgres psql -U postgres -d canary_db -c "SELECT 1;"

# Restart database
docker-compose restart postgres
```

**Application Crashes**
```bash
# View logs
docker-compose logs backend
docker-compose logs frontend

# Check exit code
docker inspect canary-backend
```

---

For additional help:
- Check logs: `docker-compose logs <service>`
- Test connectivity: `curl http://service:port`
- Monitor resources: `docker stats`
