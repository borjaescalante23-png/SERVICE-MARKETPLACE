import 'dotenv/config';
import http from 'http';
import app from './app';
import prisma from './utils/prisma';
import { processAutoReleases } from './services/escrow.service';

const PORT = parseInt(process.env.PORT || '3001');

export function broadcastToUser(_userId: string, _payload: unknown): void {
  // WebSocket not yet initialized — install ws package and restart to enable
}

function setupWebSocket(server: http.Server): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { WebSocketServer, WebSocket } = require('ws');
    const { verifyAccessToken } = require('./utils/jwt');

    type WS = typeof WebSocket.prototype;
    const wsClients = new Map<string, Set<WS>>();

    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws: WS, req: http.IncomingMessage) => {
      const url = new URL(req.url || '', `http://localhost:${PORT}`);
      const token = url.searchParams.get('token');
      let userId: string | null = null;

      if (token) {
        try {
          const payload = verifyAccessToken(token);
          userId = payload.userId;
          if (!wsClients.has(userId)) wsClients.set(userId!, new Set());
          wsClients.get(userId!)!.add(ws);
          ws.send(JSON.stringify({ type: 'CONNECTED', userId }));
          console.log(`🔌 WS connected: ${userId}`);
        } catch {
          ws.close(1008, 'Invalid token');
          return;
        }
      } else {
        ws.close(1008, 'Token required');
        return;
      }

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG' }));
        } catch {}
      });

      ws.on('close', () => {
        if (userId) {
          wsClients.get(userId)?.delete(ws);
          if (wsClients.get(userId)?.size === 0) wsClients.delete(userId!);
        }
      });
    });

    // Override broadcastToUser now that ws is available
    (broadcastToUser as any).__wsClients = wsClients;
    (broadcastToUser as any).__WebSocket = WebSocket;
    console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}/ws?token=<jwt>`);
  } catch {
    console.log('ℹ️  WebSocket desactivado (instala ws para activarlo: npm install ws)');
  }
}

async function main() {
  await prisma.$connect();
  console.log('✅ Base de datos conectada');

  const server = http.createServer(app);
  setupWebSocket(server); // gracefully no-ops if ws package not installed

  // Escrow auto-release every hour
  setInterval(async () => {
    try {
      const released = await processAutoReleases();
      if (released > 0) console.log(`💰 Auto-liberados ${released} pagos en escrow`);
    } catch (err) {
      console.error('Escrow auto-release error:', err);
    }
  }, 60 * 60 * 1000);

  // Opportunity agent every 2 hours (lazy import — only fails if DB not migrated)
  setInterval(async () => {
    try {
      const { runOpportunityAgent } = await import('./agents/opportunity.agent');
      await runOpportunityAgent();
    } catch {}
  }, 2 * 60 * 60 * 1000);

  // Clean expired match scores every 30 minutes
  setInterval(async () => {
    try {
      const { cleanExpiredMatchScores } = await import('./agents/matching.agent');
      const cleaned = await cleanExpiredMatchScores();
      if (cleaned > 0) console.log(`🧹 ${cleaned} match scores expirados eliminados`);
    } catch {}
  }, 30 * 60 * 1000);

  // Run opportunity agent once at startup (after 30s)
  setTimeout(async () => {
    try {
      const { runOpportunityAgent } = await import('./agents/opportunity.agent');
      await runOpportunityAgent();
    } catch {}
  }, 30_000);

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}/ws?token=<jwt>`);
    console.log(`📊 Prisma Studio: npx prisma studio`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
