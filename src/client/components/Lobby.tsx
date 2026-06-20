import React, { useState } from 'react';
import type { ClientGameState, ClientAction } from '@shared/types';
import { ADDONS, NEGATIVE_ADDON_TREE, POSITIVE_ADDON_TREE, countAvailableInTree } from '@shared/addons';
import { useLang, type TKey } from '../i18n';

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

// A test-mode validation error: a translation key plus optional interpolation params.
// `label` is a player name or the special "common cards" label (the latter is itself a
// translation key so it switches language too).
type TestModeError = { key: TKey; params?: Record<string, string> };

/**
 * Client-side mirror of the server's Test Mode validation. Returns a structured error if the
 * configuration is invalid, or null if it is valid (or Test Mode is disabled). The error is
 * translated at render time so the message follows the current language.
 */
function validateTestMode(state: ClientGameState, commonCardsLabel: string): TestModeError | null {
  if (!state.testMode) return null;
  const seen = new Set<string>();
  const collect = (cards: ParsedCard[] | null, label: string): TestModeError | null => {
    if (cards === null) return { key: 'invalidCardsFor', params: { label } };
    for (const c of cards) {
      const key = `${c.rank}-${c.suit}`;
      if (seen.has(key)) return { key: 'duplicateCard' };
      seen.add(key);
    }
    return null;
  };
  for (const p of state.players) {
    const raw = state.testModePlayerCards[p.id] ?? '';
    const cards = parseCardList(raw);
    if (cards !== null && cards.length > 2) return { key: 'tooManyCardsFor', params: { label: p.name } };
    const err = collect(cards, p.name);
    if (err) return err;
  }
  const commonErr = collect(parseCardList(state.testModeCommonCards), commonCardsLabel);
  if (commonErr) return commonErr;
  // [A] Unsuited X rank input: a single rank token, or empty (random). Conflicts that depend on
  // the randomly-picked addon set (e.g. a 2-9 rank under Short Deck) cannot be validated here and
  // are enforced by the server at game start; this only catches obviously invalid tokens.
  const rankRaw = state.testModeUnsuitedXRank.trim().toUpperCase();
  if (rankRaw !== '' && !RANK_TOKENS.has(rankRaw)) return { key: 'invalidRankUnsuitedX' };
  // Green X value input: a single number, or empty (random). The exact valid range depends on the
  // round-4 chip count and is enforced by the server; this only catches obviously invalid tokens
  // (anything that is not a positive integer).
  const greenXRaw = state.testModeGreenX.trim();
  if (greenXRaw !== '' && (!/^\d+$/.test(greenXRaw) || parseInt(greenXRaw, 10) < 1)) return { key: 'invalidValueGreenX' };
  return null;
}

export default function Lobby({ state, sendAction }: Props) {
  const { t } = useLang();
  const [nameInput, setNameInput] = useState(() => localStorage.getItem(LAST_NAME_KEY) ?? '');

  const hasJoined = state.myId !== '';

  const addonPoolSet = new Set(state.addonPool);
  const negativePoolCount = countAvailableInTree(NEGATIVE_ADDON_TREE, addonPoolSet);
  const positivePoolCount = countAvailableInTree(POSITIVE_ADDON_TREE, addonPoolSet);

  const testModeError = validateTestMode(state, t('commonCardsLabel'));

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
      <div style={s.title}>{t('gangGame')}</div>
      <div style={s.subtitle}>{t('gameSubtitle')}</div>

      {!hasJoined ? (
        <div style={s.card}>
          <form onSubmit={handleJoin}>
            <label style={s.label}>{t('enterName')}</label>
            <input
              style={s.input}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t('yourNamePlaceholder')}
              maxLength={20}
              autoFocus
            />
            <button style={s.button} type="submit" disabled={!nameInput.trim()}>
              {state.players.length === 1
                ? t('joinLobby1', { n: state.players.length })
                : t('joinLobbyN', { n: state.players.length })}
            </button>
          </form>
        </div>
      ) : (
        <div style={s.card}>
          <label style={s.label}>{t('playersInLobby', { n: state.players.length })}</label>
          <ul style={s.playerList}>
            {state.players.map((p) => (
              <li key={p.id} style={{ ...s.playerItem, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={s.dot} />
                  {p.name}{p.id === state.myId && ` ${t('you')}`}
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
              <label style={s.label}>{t('commonCards')}</label>
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
            {state.myStartGameVote
              ? t('startWaiting', { n: state.startGameVotes, total: state.players.length })
              : t('startGame', { n: state.startGameVotes, total: state.players.length })}
          </button>
          {!canStart && (
            <div style={s.hint}>
              {state.players.length < 2
                ? t('needTwoPlayers')
                : testModeError !== null
                  ? t(testModeError.key, testModeError.params)
                  : t('tooManyAddons')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
