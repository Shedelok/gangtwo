import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import path from 'path';
import type { ClientAction, ServerMessage, ClientGameState } from '../shared/types';
import {
  registerConnection,
  resumeSession,
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
  setTestMode,
  setTestModePlayerCards,
  setTestModeCommonCards,
  lockActionCard,
  unlockActionCard,
  useShowCard,
  clearShowCardData,
  useUnsuitedJack,
  useUnsuitedX,
  useRerollCommon,
  useSwapWithCommon,
  clearSwapWithCommonAnimation,
  useTryAnotherCard,
  useVacation,
  useDestroyAllXs,
  clearDestroyAllXsAnimation,
  clearDestroyAllXsCloud,
  useCheckNumberOfRanks,
  clearCheckNumberOfRanksCloud,
  dropCard,
  setPassCardChoice,
  clearPassCardAnimations,
  hasActivePassCardAnimations,
  buildClientState,
} from './gameState';

const PORT = 3001;

const app = express();
const httpServer = createServer(app);

// Serve static files in production
const distPath = path.resolve(process.cwd(), 'dist/client');

// Cache HTML and audio files for 5 hours (18000 seconds)
const CACHE_MAX_AGE_SECONDS = 5 * 60 * 60; // 5 hours
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html' || ext === '.mp3' || ext === '.wav' || ext === '.ogg' || ext === '.m4a') {
      res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
    }
  },
}));
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
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
    case 'RESUME_SESSION':
      resumeSession(socketId, action.sessionId);
      break;
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
    case 'SET_TEST_MODE':
      error = setTestMode(action.enabled);
      break;
    case 'SET_TEST_MODE_PLAYER_CARDS':
      error = setTestModePlayerCards(socketId, action.playerId, action.cards);
      break;
    case 'SET_TEST_MODE_COMMON_CARDS':
      error = setTestModeCommonCards(action.cards);
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
      // If this SET_READY triggered the pass-1-card simultaneous swap, schedule a
      // 2-second cleanup of the flying-card animations (spec: "a moving animation is
      // played that lasts 2 seconds").
      if (!error && hasActivePassCardAnimations()) {
        setTimeout(() => { clearPassCardAnimations(); broadcastAll(); }, 2000);
      }
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
    case 'USE_SWAP_WITH_COMMON':
      error = useSwapWithCommon(socketId, action.pocketIndex, action.commonIndex);
      // Spec: "The chosen cards swap with animation similar to how other objects in the game
      // move. Each card moves from its origin to destination point. The animation lasts 2 seconds."
      // Clear the animation marker 2 seconds after the swap is committed.
      if (!error) setTimeout(() => { clearSwapWithCommonAnimation(); broadcastAll(); }, 2000);
      break;
    case 'USE_TRY_ANOTHER_CARD':
      error = useTryAnotherCard(socketId);
      break;
    case 'USE_VACATION':
      error = useVacation(socketId);
      break;
    case 'USE_DESTROY_ALL_XS':
      error = useDestroyAllXs(socketId, action.rank);
      // Spec: "The animation takes 5 seconds. All cards disappear at the same time." — clear
      // the animating-rank marker 5 seconds after the destroy is committed.
      // Spec: "This cloud disappears after 10 seconds." — clear the dialogue cloud 10 seconds
      // after the destroy is committed.
      if (!error) {
        setTimeout(() => { clearDestroyAllXsAnimation(); broadcastAll(); }, 5000);
        setTimeout(() => { clearDestroyAllXsCloud(); broadcastAll(); }, 10000);
      }
      break;
    case 'USE_CHECK_NUMBER_OF_RANKS':
      error = useCheckNumberOfRanks(socketId, action.rank);
      // Spec: "The dialogue cloud disappears after 10 seconds."
      if (!error) {
        setTimeout(() => { clearCheckNumberOfRanksCloud(); broadcastAll(); }, 10000);
      }
      break;
    case 'DROP_CARD':
      error = dropCard(socketId, action.cardIndex);
      break;
    case 'SET_PASS_CARD_CHOICE':
      error = setPassCardChoice(socketId, action.cardIndex);
      break;
    case 'FINISH_GAME':
      finishGame(true);
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
