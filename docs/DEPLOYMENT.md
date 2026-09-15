# Deployment Guide

This guide covers the deployment process for the Clinic Management System using Docker, GitHub Actions CI/CD, and production configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- Git
- PostgreSQL client (optional, for direct database access)

### Required Accounts/Services
- GitHub account (for CI/CD)
- Docker Hub account (for container registry)
- Vercel account (for frontend hosting)
- Production server with SSH access

## Environment Configuration

### 1. Create Environment File

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your production values:

```env
# Database Configuration
POSTGRES_USER=your_secure_db_user
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=clinic_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_key_minimum_32_characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API Configuration
API_PORT=4000
NODE_ENV=production

# Frontend Configuration
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### 3. GitHub Secrets

Configure the following secrets in your GitHub repository settings:

#### CI/CD Secrets
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token

#### Deployment Secrets
- `DEPLOY_HOST` - Production server hostname/IP
- `DEPLOY_USER` - SSH username for deployment
- `DEPLOY_SSH_KEY` - Private SSH key for server access
- `DEPLOY_PATH` - Path to clinic-management directory on server (e.g., `/home/user/clinic-management`)

## Local Development

### Using Docker Compose

1. **Start all services:**
```bash
docker-compose up
```

2. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database: localhost:5432

3. **Run database migrations:**
```bash
docker exec -it clinic_api npx prisma migrate dev
```

4. **Seed the database:**
```bash
docker exec -it clinic_api npx prisma db seed
```

### Manual Development Setup

1. **Start PostgreSQL:**
```bash
docker-compose up -d db
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Configure database:**
```bash
npx prisma migrate dev
npx prisma db seed
```

4. **Start backend:**
```bash
npm run dev
```

5. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

6. **Start frontend:**
```bash
npm run dev
```

## Production Deployment

### Option 1: Docker Compose Production

1. **Prepare production environment:**
```bash
# Copy production compose file
cp docker-compose.prod.yml docker-compose.yml

# Set production environment variables
export NODE_ENV=production
```

2. **Build and start services:**
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

3. **Verify deployment:**
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### Option 2: GitHub Actions CI/CD

The system includes a complete CI/CD pipeline that automatically:

1. **On push to main branch:**
   - Runs linting
   - Performs type checking
   - Executes tests
   - Builds frontend and backend
   - Deploys frontend to Vercel
   - Deploys backend to production server

2. **On pull requests:**
   - Runs all validation checks
   - Prevents merging if checks fail

### Manual Production Build

#### Frontend
```bash
cd frontend
npm run build
# Output: .next/ directory
```

#### Backend
```bash
cd backend
npm run build
# Output: dist/ directory
```

## CI/CD Pipeline

### Pipeline Stages

1. **Lint Stage**
   - Frontend ESLint
   - Backend ESLint (if configured)
   - Frontend build verification
   - Backend build verification

2. **Type Check Stage**
   - Frontend TypeScript compilation
   - Backend TypeScript compilation

3. **Test Stage**
   - Backend API tests with PostgreSQL
   - Frontend component tests
   - Coverage reports

4. **Deploy Stage**
   - Frontend deployment to Vercel
   - Backend Docker image build and push
   - Server deployment via SSH

### Pipeline Configuration

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and includes:

- Automated testing on every push
- Conditional deployment on main branch
- Parallel job execution for faster feedback
- Docker layer caching for faster builds
- Automatic rollback capabilities

## Monitoring and Maintenance

### Health Checks

#### Backend Health
```bash
curl http://localhost:4000/api/health
```

#### Database Health
```bash
docker exec -it clinic_db_prod pg_isready -U postgres
```

### Logs

#### View all logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

#### View specific service logs
```bash
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f db
```

### Database Backups

#### Manual Backup
```bash
docker exec -it clinic_db_prod pg_dump -U postgres clinic_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Automated Backups
Configure cron job on the host:
```bash
# Daily backup at 2 AM
0 2 * * * docker exec clinic_db_prod pg_dump -U postgres clinic_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Database Restoration

```bash
# Restore from backup
docker exec -i clinic_db_prod psql -U postgres clinic_db < backup_20240101_020000.sql
```

### Updates and Maintenance

#### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

#### Database Migrations
```bash
# Run migrations in production
docker exec -it clinic_api_prod npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps db

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Restart database
docker-compose -f docker-compose.prod.yml restart db
```

#### 2. API Not Responding
```bash
# Check API logs
docker-compose -f docker-compose.prod.yml logs api

# Restart API
docker-compose -f docker-compose.prod.yml restart api

# Check environment variables
docker exec -it clinic_api_prod env
```

#### 3. Frontend Build Errors
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

#### 4. Docker Image Issues
```bash
# Rebuild from scratch
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

#### 5. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./backend ./frontend
```

### Performance Optimization

#### Database Performance
```bash
# Connect to database
docker exec -it clinic_db_prod psql -U postgres clinic_db

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM patients;
```

#### Application Performance
```bash
# Monitor resource usage
docker stats

# Check container logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Security Considerations

1. **Always use strong passwords** in production
2. **Keep dependencies updated** regularly
3. **Use HTTPS** in production
4. **Enable firewall rules** on the server
5. **Regular security audits** of dependencies
6. **Backup strategies** for disaster recovery
7. **Monitor logs** for suspicious activity

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Consult the main README.md
4. Check GitHub Issues for similar problems
