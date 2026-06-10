import express from 'express';
import cors from 'cors';
import path from 'node:path';

import './db';
import { runSeeds } from './seed';
import { errorHandler } from './middleware';

import configRouter from './routes/config';
import personaRouter from './routes/persona';
import generateRouter from './routes/generate';
import contactsRouter from './routes/contacts';
import messagesRouter from './routes/messages';
import momentsRouter from './routes/moments';
import notesRouter from './routes/notes';
import calendarRouter from './routes/calendar';
import transactionsRouter from './routes/transactions';
import productsRouter from './routes/products';
import photosRouter from './routes/photos';
import musicRouter from './routes/music';
import healthRouter from './routes/health';
import toolsRouter from './routes/tools';
import tripRouter from './routes/trip';
import moodRouter from './routes/mood';
import walletRouter from './routes/wallet';

const app = express();
const port = Number(process.env.PORT) || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态托管上传的图片
app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));

// Request log (精简)
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health
// Routes
app.use('/api/v1/config', configRouter);
app.use('/api/v1/persona', personaRouter);
app.use('/api/v1/llm', generateRouter);
app.use('/api/v1/contacts', contactsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/moments', momentsRouter);
app.use('/api/v1/notes', notesRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/photos', photosRouter);
app.use('/api/v1/music', musicRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/tools', toolsRouter);
app.use('/api/v1/trip', tripRouter);
app.use('/api/v1/wallet', walletRouter);
app.use('/api/v1/mood', moodRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use(errorHandler);

// 初始化种子数据
runSeeds();

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[landricos] backend listening at http://0.0.0.0:${port}`);
});
