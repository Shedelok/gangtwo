import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import path from 'path';
import type { ClientAction, ServerMessage, ClientGameState } from '../shared/types';
import {
  registerConnection,
  addPlayer,
  removePlayer,
  startGame,
  discardChip,
  takeFromMiddle,
  stealChip,
  setReady,
  finishGame,
  buildClientState,
} from './gameState';

const PORT = 3001;

const app = express();
const httpServer = createServer(app);

// Serve static files in production
const distPath = path.resolve(process.cwd(), 'dist/client');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// socket → socketId mapping
const socketIds = new Map<WebSocket, string>();

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function sendState(ws: WebSocket, socketId: string): void {
  const state: ClientGameState = buildClientState(socketId);
  send(ws, { type: 'STATE_UPDATE', state });
}

function broadcastAll(): void {
  for (const [ws, socketId] of socketIds) {
    sendState(ws, socketId);
  }
}

function handleAction(ws: WebSocket, socketId: string, action: ClientAction): void {
  let error: string | null = null;

  switch (action.type) {
    case 'JOIN_LOBBY':
      error = addPlayer(socketId, action.name);
      break;
    case 'START_GAME':
      error = startGame();
      break;
    case 'DISCARD_CHIP':
      error = discardChip(socketId, action.chipNumber);
      break;
    case 'TAKE_FROM_MIDDLE':
      error = takeFromMiddle(socketId, action.chipNumber);
      break;
    case 'STEAL_CHIP':
      error = stealChip(socketId, action.fromPlayerId, action.chipNumber);
      break;
    case 'SET_READY':
      error = setReady(socketId, action.ready);
      break;
    case 'FINISH_GAME':
      finishGame();
      break;
    default:
      error = 'Unknown action';
  }

  if (error) {
    send(ws, { type: 'ERROR', code: 'ACTION_ERROR', message: error });
    return;
  }

  broadcastAll();
}

wss.on('connection', (ws) => {
  const socketId = randomUUID();
  socketIds.set(ws, socketId);
  registerConnection(socketId);

  // Send current state to the new connection
  sendState(ws, socketId);

  ws.on('message', (data) => {
    let action: ClientAction;
    try {
      action = JSON.parse(data.toString()) as ClientAction;
    } catch {
      send(ws, { type: 'ERROR', code: 'PARSE_ERROR', message: 'Invalid JSON' });
      return;
    }
    handleAction(ws, socketId, action);
  });

  ws.on('close', () => {
    socketIds.delete(ws);
    removePlayer(socketId);
    broadcastAll();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Gang Game server listening on http://localhost:${PORT}`);
});
