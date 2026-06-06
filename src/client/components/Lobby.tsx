import React, { useState } from 'react';
import type { ClientGameState, ClientAction } from '@shared/types';
import { ADDONS, NEGATIVE_ADDON_TREE, POSITIVE_ADDON_TREE, countAvailableInTree } from '@shared/addons';

const s: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '480px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#f0c040',
    letterSpacing: '2px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    marginBottom: '32px',
  },
  card: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#aaa',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#0f3460',
    color: 'white',
    fontSize: '16px',
    marginBottom: '12px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2980b9',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  startButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#27ae60',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
    background: '#888',
  },
  playerList: {
    listStyle: 'none',
  },
  playerItem: {
    padding: '8px 12px',
    borderRadius: '6px',
    background: '#0f3460',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#2ecc71',
    display: 'inline-block',
  },
  hint: {
    color: '#666',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '8px',
  },
  cardsInput: {
    flex: 1,
    minWidth: 0,
    margin: '0 8px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#0a2540',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
  },
};

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
}

const LAST_NAME_KEY = 'gang_last_name';

const RANK_TOKENS = new Set(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']);
const SUIT_LETTERS = new Set(['s', 'h', 'd', 'c']);

interface ParsedCard { rank: string; suit: string; }

/** Parse a single card token (e.g. "As", "10d"). Returns null if it cannot be parsed. */
function parseCardToken(token: string): ParsedCard | null {
  const t = token.trim();
  if (t.length < 2) return null;
  const suit = t.slice(-1).toLowerCase();
  if (!SUIT_LETTERS.has(suit)) return null;
  const rank = t.slice(0, -1).toUpperCase();
  if (!RANK_TOKENS.has(rank)) return null;
  return { rank, suit };
}

/** Parse a comma-separated card list. Empty input yields []. Returns null on any parse error. */
function parseCardList(text: string): ParsedCard[] | null {
  const trimmed = text.trim();
  if (trimmed === '') return [];
  const tokens = trimmed.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  const cards: ParsedCard[] = [];
  for (const tok of tokens) {
    const card = parseCardToken(tok);
    if (!card) return null;
    cards.push(card);
  }
  return cards;
}

/**
 * Client-side mirror of the server's Test Mode validation. Returns an error string if the
 * configuration is invalid, or null if it is valid (or Test Mode is disabled).
 */
function validateTestMode(state: ClientGameState): string | null {
  if (!state.testMode) return null;
  const seen = new Set<string>();
  const collect = (cards: ParsedCard[] | null, label: string): string | null => {
    if (cards === null) return `Invalid cards for ${label}`;
    for (const c of cards) {
      const key = `${c.rank}-${c.suit}`;
      if (seen.has(key)) return 'Duplicate card in Test Mode configuration';
      seen.add(key);
    }
    return null;
  };
  for (const p of state.players) {
    const raw = state.testModePlayerCards[p.id] ?? '';
    const cards = parseCardList(raw);
    if (cards !== null && cards.length > 2) return `Too many cards for ${p.name}`;
    const err = collect(cards, p.name);
    if (err) return err;
  }
  return collect(parseCardList(state.testModeCommonCards), 'common cards');
}

export default function Lobby({ state, sendAction }: Props) {
  const [nameInput, setNameInput] = useState(() => localStorage.getItem(LAST_NAME_KEY) ?? '');

  const hasJoined = state.myId !== '';

  const addonPoolSet = new Set(state.addonPool);
  const negativePoolCount = countAvailableInTree(NEGATIVE_ADDON_TREE, addonPoolSet);
  const positivePoolCount = countAvailableInTree(POSITIVE_ADDON_TREE, addonPoolSet);

  const testModeError = validateTestMode(state);

  const canStart =
    state.players.length >= 2 &&
    state.negativeAddonCount <= negativePoolCount &&
    state.positiveAddonCount <= positivePoolCount &&
    testModeError === null;

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (nameInput.trim()) {
      localStorage.setItem(LAST_NAME_KEY, nameInput.trim());
      sendAction({ type: 'JOIN_LOBBY', name: nameInput.trim() });
    }
  }

  return (
    <div style={s.container}>
      <div style={s.title}>GANG GAME</div>
      <div style={s.subtitle}>A multiplayer card game</div>

      {!hasJoined ? (
        <div style={s.card}>
          <form onSubmit={handleJoin}>
            <label style={s.label}>Enter your display name</label>
            <input
              style={s.input}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name..."
              maxLength={20}
              autoFocus
            />
            <button style={s.button} type="submit" disabled={!nameInput.trim()}>
              Join Lobby ({state.players.length} {state.players.length === 1 ? 'player' : 'players'})
            </button>
          </form>
        </div>
      ) : (
        <div style={s.card}>
          <label style={s.label}>Players in lobby ({state.players.length})</label>
          <ul style={s.playerList}>
            {state.players.map((p) => (
              <li key={p.id} style={{ ...s.playerItem, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={s.dot} />
                  {p.name}{p.id === state.myId && ' (you)'}
                </span>
                {state.testMode && (
                  <input
                    style={s.cardsInput}
                    type="text"
                    value={state.testModePlayerCards[p.id] ?? ''}
                    onChange={(e) => sendAction({ type: 'SET_TEST_MODE_PLAYER_CARDS', playerId: p.id, cards: e.target.value })}
                    placeholder="e.g. As, 10d"
                    spellCheck={false}
                  />
                )}
                <span style={{ visibility: state.startGameVoterIds.includes(p.id) ? 'visible' : 'hidden', color: '#2ecc71', fontSize: 16, minWidth: 20, textAlign: 'right' }}>✓</span>
              </li>
            ))}
          </ul>
          {state.testMode && (
            <div style={{ marginBottom: '8px' }}>
              <label style={s.label}>Common cards</label>
              <input
                style={{ ...s.input, marginBottom: 0 }}
                type="text"
                value={state.testModeCommonCards}
                onChange={(e) => sendAction({ type: 'SET_TEST_MODE_COMMON_CARDS', cards: e.target.value })}
                placeholder="e.g. 2h, Ah, Ks, 8d"
                spellCheck={false}
              />
            </div>
          )}
          <button
            style={{
              ...s.startButton,
              ...(!canStart ? s.disabledButton : state.myStartGameVote ? { background: '#555', color: '#aaa' } : {}),
            }}
            onClick={() => canStart && sendAction({ type: 'START_GAME' })}
            disabled={!canStart}
          >
            {state.myStartGameVote ? `Waiting (${state.startGameVotes}/${state.players.length})` : `Start Game (${state.startGameVotes}/${state.players.length})`}
          </button>
          {!canStart && (
            <div style={s.hint}>
              {state.players.length < 2
                ? 'Need at least 2 players to start'
                : testModeError !== null
                  ? testModeError
                  : 'Too many addons requested for the selected pool'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
