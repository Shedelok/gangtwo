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
  onStart: (addonId: string) => void;
  onCancel: () => void;
  onCardElRef: (addonId: string, el: HTMLDivElement | null) => void;
}


function isAddonAvailable(addonId: string, state: ClientGameState): boolean {
  if (state.phase !== 'game') return false;
  if (addonId === 'show-1-card-to-1-player') return !state.showCardUsed && !!state.myHoleCards;
  if (addonId === 'action-unsuited-jack') return !state.unsuitedJackUsed && !!state.myHoleCards;
  if (addonId === 'action-reroll-common') return !state.rerollCommonUsed && state.communityCards.length > 0;
  return false;
}

function isAddonUsed(addonId: string, state: ClientGameState): boolean {
  if (addonId === 'show-1-card-to-1-player') return state.showCardUsed;
  if (addonId === 'action-unsuited-jack') return state.unsuitedJackUsed;
  if (addonId === 'action-reroll-common') return state.rerollCommonUsed;
  return false;
}

export default function ActionCardPanel({ state, step, activeAddonId, onStart, onCancel, onCardElRef }: Props) {
  const actionAddons = ADDONS.filter(a =>
    a.hasAction && state.enabledAddons.includes(a.id) && !isAddonUsed(a.id, state)
  );
  if (actionAddons.length === 0) return null;

  const lockedByOther = !!state.actionCardLock && state.actionCardLock.playerId !== state.myId;

  const handleCardClick = (addonId: string) => {
    if (lockedByOther) return;
    if (step !== 'idle' && activeAddonId === addonId) { onCancel(); return; }
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
          const locked = lockedByOther && state.actionCardLock?.addonId === addon.id;
          return (
            <div
              key={addon.id}
              ref={el => onCardElRef(addon.id, el)}
              onClick={() => handleCardClick(addon.id)}
              style={{
                width: CARD_W, height: CARD_H,
                borderRadius: 6,
                border: active ? '2px solid #f87171' : '2px solid #4a7a4a',
                background: active ? '#3d1515' : '#1a2d1a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '6px 4px', textAlign: 'center', cursor: locked ? 'default' : 'pointer',
                userSelect: 'none',
                visibility: locked ? 'hidden' : 'visible',
                position: 'relative',
              }}
            >
              {!active && (
                <div style={{ fontSize: 9, color: '#90c090', lineHeight: 1.4 }}>
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
