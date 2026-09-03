import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import patientRoutes from './routes/patients';
import notificationRoutes from './routes/notifications';
import appointmentRoutes from './routes/appointments';
import medicalRoutes from './routes/medical';
import dashboardRoutes from './routes/dashboard';
import billingRoutes from './routes/billing';
import availabilityRoutes from './routes/availability';
import encounterRoutes from './routes/encounters';
import labRoutes from './routes/lab';
import reportRoutes from './routes/reports';
import assignmentRoutes from './routes/assignments';
import feeRoutes from './routes/fees';
import auditRoutes from './routes/audit';
import { setupPrismaMiddleware } from './lib/prismaMiddleware';
import { prisma } from './lib/prisma';
import { checkAndInitDatabase, seedDefaultData } from './lib/dbInit';

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, pinoPretty({
  colorize: true,
  translateTime: 'HH:MM:ss Z',
  ignore: 'pid,hostname',
}));

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 4000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://host.docker.internal:3000',
  'http://172.18.0.4:3000',
  'https://clinic-management-system-five-mauve.vercel.app',
  'https://clinic-management-system-ten-delta.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : []),
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin (no Origin header)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (!allowed) return false;
      return origin === allowed || origin.replace(/\/$/, '') === allowed.replace(/\/$/, '');
    });

    // Automatically allow any Vercel deployment (production, preview, branch URLs)
    const isVercel = origin.endsWith('.vercel.app');

    if (isAllowed || isVercel || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Setup Prisma middleware for automation
setupPrismaMiddleware();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Ready check endpoint
app.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/lab-results', labRoutes);
app.use('/api/lab-orders', labRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/audit', auditRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Clinic Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      patients: '/api/patients',
      notifications: '/api/notifications',
      appointments: '/api/appointments',
      medical: '/api/medical',
      dashboard: '/api/dashboard',
      billing: '/api/billing',
      health: '/api/health',
      seed: '/api/seed',
    },
  });
});

// Database health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: 'healthy',
      database: 'connected',
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error?.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Manual database seed endpoint (safe: idempotent upserts)
app.get('/api/seed', async (req, res) => {
  try {
    await seedDefaultData();
    const count = await prisma.user.count();
    res.json({
      success: true,
      message: 'Database seeded successfully with default clinic accounts!',
      userCount: count,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Seed failed',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
    },
  });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
  await checkAndInitDatabase();
});

export default app;
