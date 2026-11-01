import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
