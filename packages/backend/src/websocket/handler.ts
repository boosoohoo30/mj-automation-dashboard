import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

let wss: WebSocketServer;

export function setupWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });
  });

  return wss;
}

export function broadcast(event: string, data: unknown): void {
  if (!wss) return;
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
