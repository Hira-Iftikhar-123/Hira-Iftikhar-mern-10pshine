import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import notesRoutes from './routes/notes.routes';
import { errorHandler } from './middleware/error.middleware';
import { ensureTables } from './services/auth.service';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(requestLogger);

// Initialize database tables on startup
ensureTables().catch((err) => {
    logger.error(err, 'Failed to ensure database tables');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

app.use(errorHandler);

export default app;