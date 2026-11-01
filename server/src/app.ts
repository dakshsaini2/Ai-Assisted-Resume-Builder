import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: config.clientUrl, credentials: true }));

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler (must be registered after routes)
app.use(errorHandler);

export default app;
