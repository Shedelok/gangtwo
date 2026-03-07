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
  toggleStartGameVote,
  discardChip,
  takeFromMiddle,
  stealChip,
  setReady,
  revealCards,
  submitRankGuess,
  toggleRestartVote,
  finishGame,
  toggleAddon,
  setAddonCount,
  lockActionCard,
  unlockActionCard,
  useShowCard,
  clearShowCardData,
  useUnsuitedJack,
  useUnsuitedX,
  useRerollCommon,
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
      error = toggleStartGameVote(socketId);
      break;
    case 'TOGGLE_ADDON':
      error = toggleAddon(action.addonId);
      break;
    case 'SET_ADDON_COUNT':
      error = setAddonCount(action.addonType, action.count);
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
    case 'REVEAL_CARDS':
      error = revealCards(socketId);
      break;
    case 'SUBMIT_RANK_GUESS':
      error = submitRankGuess(socketId, action.addonId, action.rank);
      break;
    case 'TOGGLE_RESTART_VOTE':
      error = toggleRestartVote(socketId);
      break;
    case 'LOCK_ACTION_CARD':
      error = lockActionCard(socketId, action.addonId);
      break;
    case 'UNLOCK_ACTION_CARD':
      error = unlockActionCard(socketId, action.addonId);
      break;
    case 'USE_SHOW_CARD':
      error = useShowCard(socketId, action.targetPlayerId, action.cardIndex);
      if (!error) setTimeout(() => { clearShowCardData(); broadcastAll(); }, 5000);
      break;
    case 'USE_UNSUITED_JACK':
      error = useUnsuitedJack(socketId, action.cardIndex);
      break;
    case 'USE_UNSUITED_X':
      error = useUnsuitedX(socketId, action.cardIndex);
      break;
    case 'USE_REROLL_COMMON':
      error = useRerollCommon(socketId, action.cardIndex);
      break;
    case 'FINISH_GAME':
      finishGame(true, true);
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
