import React from 'react';
import type { ClientGameState } from '@shared/types';
import { ADDONS } from '@shared/addons';

export type ActionWorkflowStep = 'idle' | 'select-card' | 'select-player';

export const CARD_W = 80;
export const CARD_H = 110;

interface Props {
  state: ClientGameState;
  step: ActionWorkflowStep;
  activeAddonId: string | null;
  returningAddonId: string | null;
  onStart: (addonId: string) => void;
  onCancel: () => void;
  onCardElRef: (addonId: string, el: HTMLDivElement | null) => void;
}


function isAddonAvailable(addonId: string, state: ClientGameState): boolean {
  if (state.phase !== 'game') return false;
  if (addonId === 'show-1-card-to-1-player') return !state.showCardUsed && !!state.myHoleCards;
  if (addonId === 'action-unsuited-jack') return !state.unsuitedJackUsed && !!state.myHoleCards;
  if (addonId === 'action-unsuited-x') return !state.unsuitedXUsed && !!state.myHoleCards;
  if (addonId === 'action-reroll-common') return !state.rerollCommonUsed && state.communityCards.length > 0;
  return false;
}

function isAddonUsed(addonId: string, state: ClientGameState): boolean {
  if (addonId === 'show-1-card-to-1-player') return state.showCardUsed;
  if (addonId === 'action-unsuited-jack') return state.unsuitedJackUsed;
  if (addonId === 'action-unsuited-x') return state.unsuitedXUsed;
  if (addonId === 'action-reroll-common') return state.rerollCommonUsed;
  return false;
}

export default function ActionCardPanel({ state, step, activeAddonId, returningAddonId, onStart, onCancel, onCardElRef }: Props) {
  const actionAddons = ADDONS.filter(a =>
    a.hasAction && state.enabledAddons.includes(a.id) && !isAddonUsed(a.id, state)
  );
  if (actionAddons.length === 0) return null;

  const lockedByOther = !!state.actionCardLock && state.actionCardLock.playerId !== state.myId;
  const iAmUsingACard = step !== 'idle';

  const handleCardClick = (addonId: string) => {
    if (lockedByOther) return;
    if (iAmUsingACard && activeAddonId === addonId) { onCancel(); return; }
    if (iAmUsingACard) return; // can't start another card while already using one
    if (!isAddonAvailable(addonId, state)) return;
    onStart(addonId);
  };

  return (
    <div style={{
      position: 'fixed', right: 16, top: 60,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
    }}>
      {/* Action cards table */}
      <div style={{
        background: '#1a2030', border: '1px solid #2a3a4a', borderRadius: 8,
        padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
        minWidth: CARD_W + 20,
      }}>
        <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Actions</div>
        {actionAddons.map(addon => {
          const active = step !== 'idle' && activeAddonId === addon.id;
          const locked = (lockedByOther && state.actionCardLock?.addonId === addon.id) || returningAddonId === addon.id;
          const dimmed = (lockedByOther && !locked) || (iAmUsingACard && !active);
          return (
            <div
              key={addon.id}
              ref={el => onCardElRef(addon.id, el)}
              onClick={() => handleCardClick(addon.id)}
              style={{
                width: CARD_W, height: CARD_H,
                borderRadius: 6,
                border: active
                  ? '2px solid #f87171'
                  : (addon.id === 'action-unsuited-jack' || addon.id === 'action-unsuited-x') ? '2px solid #8B5A1A' : '2px solid #4a7a4a',
                background: active
                  ? '#3d1515'
                  : (addon.id === 'action-unsuited-jack' || addon.id === 'action-unsuited-x') ? '#B87333' : addon.id === 'show-1-card-to-1-player' ? '#000' : addon.id === 'action-reroll-common' ? '#fff' : '#1a2d1a',
                display: 'flex', flexDirection: 'column',
                padding: '6px 6px', cursor: (locked || dimmed) ? 'default' : 'pointer',
                userSelect: 'none',
                visibility: locked ? 'hidden' : 'visible',
                opacity: dimmed ? 0.4 : 1,
                position: 'relative',
              }}
            >
              {!active && (addon.id === 'action-unsuited-jack' || addon.id === 'action-unsuited-x') && (() => {
                const rank = addon.id === 'action-unsuited-jack' ? 'J' : (state.unsuitedXRank ?? 'X');
                return (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }}>
                      <span style={{ fontSize: 18, fontWeight: 'bold' }}>{rank}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 'bold' }}>
                      {rank}
                    </div>
                  </>
                );
              })()}
              {!active && addon.id === 'show-1-card-to-1-player' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#90c090" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="12" rx="10" ry="6" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              )}
              {!active && addon.id === 'action-reroll-common' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23,4 23,10 17,10" />
                    <polyline points="1,20 1,14 7,14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </div>
              )}
              {!active && addon.id !== 'action-unsuited-jack' && addon.id !== 'action-unsuited-x' && addon.id !== 'show-1-card-to-1-player' && addon.id !== 'action-reroll-common' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#90c090', lineHeight: 1.4, textAlign: 'center' }}>
                  {addon.short}
                </div>
              )}
              {active && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, pointerEvents: 'none',
                }}>
                  <span style={{ fontSize: 36, color: '#ef4444', lineHeight: 1, fontWeight: 'bold', textShadow: '0 0 6px rgba(239,68,68,0.6)' }}>✕</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
