# Development Setup Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)
- Git

## Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Clinic-Management-System
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Services with Docker**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 4000
- Frontend on port 3000

## Local Development (Without Docker)

### Backend Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Set up environment variables**
```bash
# Copy the root .env file or create backend/.env
cp ../.env .env
```

3. **Generate Prisma client**
```bash
npx prisma generate
```

4. **Run database migrations**
```bash
npx prisma migrate dev
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at http://localhost:4000

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Set up environment variables**
```bash
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL if needed
```

3. **Start the development server**
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Database Management

### View Database with Prisma Studio
```bash
cd backend
npx prisma studio
```

### Create a New Migration
```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

### Reset Database (⚠️ This deletes all data)
```bash
cd backend
npx prisma migrate reset
```

## Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild a specific service
docker-compose build api
docker-compose up -d api

# Run database migrations in Docker
docker-compose exec api npx prisma migrate deploy
```

## Troubleshooting

### Port Already in Use
If you get port conflicts, change the ports in `.env` or `docker-compose.yml`.

### Database Connection Issues
Ensure PostgreSQL is running and accessible:
```bash
docker-compose ps
docker-compose logs db
```

### Prisma Client Generation
If you get Prisma errors, regenerate the client:
```bash
cd backend
npx prisma generate
```

## Next Steps

After setup, you can:
1. Access the frontend at http://localhost:3000
2. Access the API at http://localhost:4000
3. Check API health at http://localhost:4000/health
4. Start implementing features following the 15-day plan
