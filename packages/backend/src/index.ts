import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { setupWebSocket } from './websocket/handler.js';
import workflowRoutes from './routes/workflow.js';
import reviewRoutes from './routes/review.js';
import generationRoutes from './routes/generation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Static files (uploaded assets)
app.use('/assets', express.static(join(__dirname, '../assets')));

// API routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/generation', generationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[WS] WebSocket available at ws://localhost:${PORT}/ws`);
});
