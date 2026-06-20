import React, { createContext, useContext, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Russian Language Toggle (spec/base/ui/shared.md "Russian Language Toggle").
//
// The toggle switches ALL text in the app for the current player from English to
// Russian, except the text/letters on the cards (card ranks/suits are never
// translated). The choice is per-player (client-side only) and is persisted in
// localStorage so the player keeps their language across reloads.
//
// This module provides the language context plus a `t()` lookup helper and a set
// of small helpers for translating dynamic, domain-specific strings (hand-rank
// names, card values, rank pluralization, addon descriptions, share-info labels).
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'ru';

const LANG_KEY = 'gang_lang';

interface LangCtxValue {
  lang: Lang;
  toggle: () => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangCtxValue>({
  lang: 'en',
  toggle: () => {},
  t: (key) => STRINGS[key]?.en ?? key,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) === 'ru' ? 'ru' : 'en'));
  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'ru' ? 'en' : 'ru';
      try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const t = useCallback((key: TKey, params?: Record<string, string | number>) => {
    const entry = STRINGS[key];
    let text = entry ? entry[lang] : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }, [lang]);
  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLang(): LangCtxValue {
  return useContext(LangContext);
}

// ── Fixed UI strings ─────────────────────────────────────────────────────────
type Translations = { en: string; ru: string };

const STRINGS = {
  // Connection / status
  disconnected: { en: 'Disconnected. Reconnecting...', ru: 'Соединение потеряно. Переподключение...' },
  connecting: { en: 'Connecting...', ru: 'Подключение...' },

  // Sound bar
  volume: { en: 'Volume', ru: 'Громкость' },
  sounds: { en: 'Sounds', ru: 'Звуки' },
  closeSounds: { en: 'Close sounds', ru: 'Закрыть звуки' },
  handRanking: { en: 'Hand Ranking', ru: 'Старшинство комбинаций' },
  myCurrentHand: { en: 'My Current Hand', ru: 'Моя текущая комбинация' },
  testMode: { en: 'Test Mode', ru: 'Тестовый режим' },

  // Sound labels
  sound_STEAL_FROM_YOU: { en: 'Steal from you', ru: 'Кража у вас' },
  sound_CHIP_MOVE: { en: 'Chip move', ru: 'Перемещение фишки' },
  sound_CARD_FLIP: { en: 'Card flip', ru: 'Переворот карты' },
  sound_GAME_START: { en: 'Game start', ru: 'Начало игры' },
  sound_ACTION_CARD_PLAYED: { en: 'Action card played', ru: 'Карта действия сыграна' },
  sound_ACTION_CARD_TAKEN: { en: 'Action card taken', ru: 'Карта действия взята' },
  sound_PRISON_TAKEN_EFFECT: { en: 'Prison taken effect', ru: 'Тюрьма сработала' },
  sound_CARD_DISCARDED: { en: 'Card discarded', ru: 'Карта сброшена' },
  sound_VACATION_STARTED: { en: 'Vacation started', ru: 'Отпуск начался' },
  sound_GREEN_X_FAIL: { en: 'Green X fail', ru: 'Зелёный X провал' },

  // Addons panel
  addons: { en: 'Addons', ru: 'Дополнения' },
  negative: { en: 'Negative', ru: 'Негативные' },
  positive: { en: 'Positive', ru: 'Позитивные' },
  copy: { en: 'Copy', ru: 'Копировать' },
  codePlaceholder: { en: 'code', ru: 'код' },

  // Top-right buttons
  stopTheGame: { en: 'Stop the game', ru: 'Завершить игру' },
  restart: { en: 'Restart ({n}/{total})', ru: 'Рестарт ({n}/{total})' },
  restartWaiting: { en: 'Waiting ({n}/{total})', ru: 'Ожидание ({n}/{total})' },

  // Lobby
  gangGame: { en: 'GANG GAME', ru: 'GANG GAME' },
  gameSubtitle: { en: 'A multiplayer card game', ru: 'Многопользовательская карточная игра' },
  enterName: { en: 'Enter your display name', ru: 'Введите ваше имя' },
  yourNamePlaceholder: { en: 'Your name...', ru: 'Ваше имя...' },
  joinLobby1: { en: 'Join Lobby ({n} player)', ru: 'Войти в лобби ({n} игрок)' },
  joinLobbyN: { en: 'Join Lobby ({n} players)', ru: 'Войти в лобби ({n} игроков)' },
  playersInLobby: { en: 'Players in lobby ({n})', ru: 'Игроки в лобби ({n})' },
  you: { en: '(you)', ru: '(вы)' },
  commonCards: { en: 'Common cards', ru: 'Общие карты' },
  startGame: { en: 'Start Game ({n}/{total})', ru: 'Начать игру ({n}/{total})' },
  startWaiting: { en: 'Waiting ({n}/{total})', ru: 'Ожидание ({n}/{total})' },
  needTwoPlayers: { en: 'Need at least 2 players to start', ru: 'Для старта нужно минимум 2 игрока' },
  tooManyAddons: { en: 'Too many addons requested for the selected pool', ru: 'Запрошено слишком много дополнений для выбранного набора' },

  // Test mode validation
  invalidCardsFor: { en: 'Invalid cards for {label}', ru: 'Неверные карты для {label}' },
  duplicateCard: { en: 'Duplicate card in Test Mode configuration', ru: 'Повторяющаяся карта в настройках тестового режима' },
  tooManyCardsFor: { en: 'Too many cards for {label}', ru: 'Слишком много карт для {label}' },
  commonCardsLabel: { en: 'common cards', ru: 'общих карт' },
  invalidRankUnsuitedX: { en: 'Invalid rank for Unsuited X', ru: 'Неверный ранг для «Безмастный X»' },
  invalidValueGreenX: { en: 'Invalid value for Green X', ru: 'Неверное значение для «Зелёный X»' },

  // Table / seats
  gameOver: { en: 'GAME OVER', ru: 'ИГРА ОКОНЧЕНА' },
  round: { en: 'ROUND {n} / 4', ru: 'РАУНД {n} / 4' },
  win: { en: 'WIN', ru: 'ПОБЕДА' },
  loss: { en: 'LOSS', ru: 'ПОРАЖЕНИЕ' },
  pass1Card: { en: 'Pass 1 Card', ru: 'Передать 1 карту' },
  take: { en: 'Take', ru: 'Взять' },
  returnChip: { en: 'Return', ru: 'Вернуть' },
  steal: { en: 'Steal', ru: 'Украсть' },
  revealCards: { en: 'Reveal cards', ru: 'Открыть карты' },
  dropCard: { en: 'Drop card', ru: 'Сбросить карту' },
  pickCardToDrop: { en: 'Pick card to drop', ru: 'Выберите карту для сброса' },
  passCard: { en: 'Pass card', ru: 'Передать карту' },
  waiting: { en: 'Waiting', ru: 'Ожидание' },
  moveToNextRound: { en: 'Move to next round', ru: 'Перейти к следующему раунду' },
  guessCard: { en: 'Guess Card', ru: 'Угадать карту' },
  guessHand: { en: 'Guess Hand', ru: 'Угадать комбинацию' },

  // Share info labels
  shareBlackjackSum: { en: 'Blackjack Sum', ru: 'Сумма блэкджека' },
  shareNumberOfFaces: { en: 'Number of Faces', ru: 'Количество картинок' },

  // Action panel
  actions: { en: 'Actions', ru: 'Действия' },

  // Modals
  confirm: { en: 'Confirm', ru: 'Подтвердить' },
  cancel: { en: 'Cancel', ru: 'Отмена' },
  takeVacation: { en: "Take 'Vacation' card?", ru: 'Взять карту «Отпуск»?' },
  useTryAnother: { en: "Use 'Try Another Card'?", ru: 'Использовать «Попробовать другую карту»?' },
  chooseRank: { en: 'Choose rank', ru: 'Выберите ранг' },
  selectRankToDestroy: { en: 'Select rank to destroy', ru: 'Выберите ранг для уничтожения' },
  destroyRanks: { en: 'Destroy {ranks}', ru: 'Уничтожить {ranks}' },
  selectRankToCheck: { en: 'Select rank to check', ru: 'Выберите ранг для проверки' },
  checkNumberOf: { en: 'Check number of {ranks}', ru: 'Проверить количество {ranks}' },

  // Dialogue clouds
  destroyed: { en: 'Destroyed {ranks}', ru: 'Уничтожены {ranks}' },
  thereIsOne: { en: 'There is {count} {rank} in the game right now', ru: 'Сейчас в игре {count} {rank}' },
  thereAreN: { en: 'There are {count} {ranks} in the game right now', ru: 'Сейчас в игре {count} {ranks}' },
  onlyVisibleToYou: { en: '(Only visible to you)', ru: '(Видно только вам)' },
} satisfies Record<string, Translations>;

export type TKey = keyof typeof STRINGS;

// ── Hand rank names ──────────────────────────────────────────────────────────
// Keyed by the canonical English name (which is also what gets stored as a guess
// vote and used as a server key). At display time these are mapped to the active
// language.
const HAND_RANK_RU: Record<string, string> = {
  'Royal Flush': 'Роял-флеш',
  'Straight Flush': 'Стрит-флеш',
  'Four of a Kind': 'Каре',
  'Full House': 'Фулл-хаус',
  'Flush': 'Флеш',
  'Straight': 'Стрит',
  'Three of a Kind': 'Тройка',
  'Two Pair': 'Две пары',
  'One Pair': 'Пара',
  'High Card': 'Старшая карта',
};

export function tHandRank(en: string, lang: Lang): string {
  if (lang === 'en') return en;
  return HAND_RANK_RU[en] ?? en;
}

// ── Card values (used by the "Guess Card" addon dropdown and dialogue clouds) ─
// The English label format is "(A) Ace". The rank letter inside the parentheses
// is a card token and is never translated; only the spelled-out word is.
const CARD_VALUE_WORD_RU: Record<string, string> = {
  'Ace': 'Туз',
  'King': 'Король',
  'Queen': 'Дама',
  'Jack': 'Валет',
  'Ten': 'Десятка',
  'Nine': 'Девятка',
  'Eight': 'Восьмёрка',
  'Seven': 'Семёрка',
  'Six': 'Шестёрка',
  'Five': 'Пятёрка',
  'Four': 'Четвёрка',
  'Three': 'Тройка',
  'Two': 'Двойка',
};

export function tCardValue(en: string, lang: Lang): string {
  if (lang === 'en') return en;
  // en looks like "(A) Ace" → translate only the trailing word, keep the token.
  const m = en.match(/^(\([^)]*\))\s+(.+)$/);
  if (!m) return en;
  const word = CARD_VALUE_WORD_RU[m[2]] ?? m[2];
  return `${m[1]} ${word}`;
}

// A submitted guess vote is either a hand-rank name or a card-value label. This
// helper translates whichever it is for display.
export function tGuessVote(en: string, lang: Lang): string {
  if (lang === 'en') return en;
  if (en.startsWith('(')) return tCardValue(en, lang);
  return tHandRank(en, lang);
}

// ── Rank pluralization for the destroy/check action clouds and confirm labels ─
// English uses "Aces"/"Kings"/.../"8s". Russian uses genitive-plural forms that
// read naturally after "Уничтожить"/"количество".
const RANK_PLURAL_EN: Record<string, string> = {
  A: 'Aces', K: 'Kings', Q: 'Queens', J: 'Jacks',
};
const RANK_PLURAL_RU: Record<string, string> = {
  A: 'тузов', K: 'королей', Q: 'дам', J: 'валетов',
  '10': 'десяток', '9': 'девяток', '8': 'восьмёрок', '7': 'семёрок',
  '6': 'шестёрок', '5': 'пятёрок', '4': 'четвёрок', '3': 'троек', '2': 'двоек',
};
const RANK_SINGULAR_EN: Record<string, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack',
};
const RANK_SINGULAR_RU: Record<string, string> = {
  A: 'туз', K: 'король', Q: 'дама', J: 'валет',
  '10': 'десятка', '9': 'девятка', '8': 'восьмёрка', '7': 'семёрка',
  '6': 'шестёрка', '5': 'пятёрка', '4': 'четвёрка', '3': 'тройка', '2': 'двойка',
};

export function tRankPlural(rank: string, lang: Lang): string {
  if (lang === 'en') return RANK_PLURAL_EN[rank] ?? `${rank}s`;
  return RANK_PLURAL_RU[rank] ?? `${rank}`;
}

export function tRankSingular(rank: string, lang: Lang): string {
  if (lang === 'en') return RANK_SINGULAR_EN[rank] ?? rank;
  return RANK_SINGULAR_RU[rank] ?? rank;
}

// ── Addon short labels and long descriptions ─────────────────────────────────
// Keyed by addon id. English text is kept in src/shared/addons.ts (the source of
// truth for the canonical text); the Russian translations live here. The "[A] "
// prefix on action-card addons marks an action card and is kept verbatim.
interface AddonText { short: string; long: string }

const ADDON_RU: Record<string, AddonText> = {
  'guess-highest-red-chip-hand-rank': {
    short: 'Угадать комбинацию (старшая)',
    long: 'Перед тем как игрок с красной фишкой наибольшего значения откроет свои карты, остальные игроки должны совместно договориться, какая у этого игрока комбинация (пара/две пары/стрит/и т.д.).',
  },
  'guess-2nd-highest-red-chip-hand-rank': {
    short: 'Угадать комбинацию (2-я по старшинству)',
    long: 'Перед тем как игрок со 2-й по старшинству красной фишкой откроет свои карты, остальные игроки должны совместно договориться, какая у этого игрока комбинация (пара/две пары/стрит/и т.д.).',
  },
  'guess-lowest-red-chip-hand-rank': {
    short: 'Угадать комбинацию (младшая)',
    long: 'Перед тем как игрок с красной фишкой наименьшего значения откроет свои карты, остальные игроки должны совместно договориться, какая у этого игрока комбинация (пара/две пары/стрит/и т.д.).',
  },
  'guess-highest-red-chip-card-value': {
    short: 'Угадать карту (старшая)',
    long: 'Перед тем как игрок с красной фишкой наибольшего значения откроет свои карты, остальные игроки должны совместно договориться, какое достоинство карты есть у этого игрока (туз/дама/семёрка/и т.д.).',
  },
  'clubs-spades-diamonds-hearth': {
    short: 'Чёрные и красные',
    long: 'Вместо 4 логических мастей остаётся только 2: чёрная (трефы и пики) и красная (бубны и черви).',
  },
  'short-deck': {
    short: 'Короткая колода',
    long: 'Игра ведётся только картами от 10 до туза. Все двойки, тройки, ..., девятки убираются.',
  },
  'additional-card-flop': {
    short: 'Доп. карта на флопе',
    long: 'Когда начинается 2-й раунд, на стол выкладываются 4 общих карты вместо обычных 3.',
  },
  'additional-card-turn': {
    short: 'Доп. карта на тёрне',
    long: 'Когда начинается 3-й раунд, на стол выкладываются 2 общих карты вместо обычной 1.',
  },
  'additional-card-river': {
    short: 'Доп. карта на ривере',
    long: 'Когда начинается 4-й раунд, на стол выкладываются 2 общих карты вместо обычной 1.',
  },
  'no-white-chips': {
    short: 'Без белых фишек',
    long: 'Раздачи белых фишек нет. Игра начинается со 2-го раунда.',
  },
  'no-yellow-chips': {
    short: 'Без жёлтых фишек',
    long: 'Раздачи жёлтых фишек нет. После того как открыты общие карты 2-го раунда, раунд сразу заканчивается и игра переходит к 3-му раунду.',
  },
  'no-orange-chips': {
    short: 'Без оранжевых фишек',
    long: 'Раздачи оранжевых фишек нет. После того как открыты общие карты 3-го раунда, раунд сразу заканчивается и игра переходит к 4-му раунду.',
  },
  'ones-are-black': {
    short: 'Чёрные 1',
    long: 'Все фишки значения 1 становятся чёрными. Чёрную фишку нельзя украсть или сбросить после того, как её впервые взяли из середины стола.',
  },
  'ns-are-black': {
    short: 'Чёрные N',
    long: 'Фишки наибольшего значения (равного числу игроков) становятся чёрными. Чёрную фишку нельзя украсть или сбросить после того, как её впервые взяли из середины стола.',
  },
  'xs-are-black': {
    short: 'Чёрные X',
    long: 'В начале игры определяется случайное число X от 1 до N. Фишки значения X становятся чёрными. Чёрную фишку нельзя украсть или сбросить после того, как её впервые взяли из середины стола. X остаётся неизменным во всех раундах.',
  },
  'no-old-chips': {
    short: 'Без старых фишек',
    long: 'В начале каждого раунда (кроме первого) все фишки предыдущего раунда убираются, и игрок не может их видеть.',
  },
  'prison': {
    short: 'Тюрьма',
    long: 'В случайном раунде (кроме последнего) случайный игрок попадает в тюрьму и не может участвовать в этом раунде. В этом раунде на стол кладётся на одну фишку меньше.',
  },
  'pass-1-card': {
    short: 'Передать 1 карту',
    long: 'После раздачи карманных карт в 1-м раунде каждый из вас выбирает одну из своих карманных карт. Затем все одновременно передают выбранную карту игроку слева как карманную.',
  },
  'share-blackjack-sum': {
    short: 'Сообщить сумму блэкджека',
    long: 'После раздачи карманных карт в 1-м раунде каждый называет сумму значений своих карманных карт. 2–10 имеют значения 2–10. J, Q и K имеют значение 10. A имеет значение 11. Это делается как отдельный предыгровой раунд, который заканчивается, когда все нажали кнопку готовности.',
  },
  'share-number-of-faces': {
    short: 'Сообщить количество картинок',
    long: 'После раздачи карманных карт в 1-м раунде каждый игрок говорит, сколько у него «картинок» (J, Q, K). Это делается как отдельный предыгровой раунд, который заканчивается, когда все нажали кнопку готовности.',
  },
  'green-x': {
    short: 'Зелёный X',
    long: 'В последнем раунде случайная фишка X становится зелёной. Зелёную фишку, взятую правильным игроком (тем, у кого действительно X-я по силе комбинация), нельзя украсть или сбросить. Если зелёную фишку взял неправильный игрок, она становится обычной.',
  },
  'show-1-card-to-1-player': {
    short: '[A] Показать 1 карту 1 игроку',
    long: 'Один раз за игру один из игроков может показать одну из своих карт другому игроку на 5 секунд.',
  },
  'action-unsuited-jack': {
    short: '[A] Безмастный валет',
    long: 'Один раз за игру один из игроков может заменить одну из своих карт на валета. Для этого игрок должен сбросить одну из своих карт. Этот валет не имеет масти (не может использоваться для флеша).',
  },
  'action-unsuited-x': {
    short: '[A] Безмастный X',
    long: 'Один раз за игру один из игроков может заменить одну из своих карт безмастной картой случайного ранга, определяемого в начале игры. Для этого игрок должен сбросить одну из своих карт. Эта карта не имеет масти (не может использоваться для флеша).',
  },
  'action-reroll-common': {
    short: '[A] Переброс общей',
    long: 'Один раз за игру один из игроков может заменить одну из общих карт другой случайной картой.',
  },
  'action-swap-with-common': {
    short: '[A] Обмен с общей',
    long: 'Один раз за игру один из игроков может обменять одну из своих карт на одну из общих карт.',
  },
  'action-try-another-card': {
    short: '[A] Попробовать другую карту',
    long: 'Один раз за игру один из игроков может взять одну карту из колоды и добавить её в свою руку. После этого игрок должен сбросить одну из своих карт. Это может быть та карта, которую он только что взял из колоды.',
  },
  'action-destroy-all-xs': {
    short: '[A] Уничтожить все R',
    long: 'Один раз за игру один из игроков может уничтожить все карты выбранного ранга R. Уничтожение сбрасывает все такие карты, где бы они ни находились: в колоде, на столе или в руках игроков.',
  },
  'action-check-number-of-ranks': {
    short: '[A] Проверить количество рангов',
    long: 'Один раз за игру один из игроков может проверить, сколько карт выбранного ранга R находится в игре. Он видит общее число карт ранга R в руках игроков и на столе (не считая неиспользованных карт действий).',
  },
  'action-vacation': {
    short: '[A] Отпуск',
    long: 'Один раз за игру один из игроков может взять особую карту «Отпуск», которая остаётся у него до конца игры. Игрок с картой отпуска не участвует в последнем раунде. Этот игрок не учитывается при определении победы/поражения после последнего раунда. Карту отпуска нельзя взять во время последнего раунда.',
  },
};

export function tAddonShort(id: string, en: string, lang: Lang): string {
  if (lang === 'en') return en;
  return ADDON_RU[id]?.short ?? en;
}

export function tAddonLong(id: string, en: string, lang: Lang): string {
  if (lang === 'en') return en;
  return ADDON_RU[id]?.long ?? en;
}

// Share-info label is computed by the server in English ("Number of Faces" or
// "Blackjack Sum"). Translate by matching the English value.
export function tShareInfoLabel(english: string, t: (k: TKey) => string): string {
  if (english === 'Number of Faces') return t('shareNumberOfFaces');
  if (english === 'Blackjack Sum') return t('shareBlackjackSum');
  return english;
}
