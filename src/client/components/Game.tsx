import React from 'react';
import type { ClientGameState, ClientAction } from '@shared/types';
import Table from './Table';

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
  readOnly?: boolean;
  onCardSelect?: (idx: 0 | 1) => void;
  onPlayerSelect?: (playerId: string) => void;
  onCommonCardClick?: (idx: number) => void;
  actionInProgress?: boolean;
  onSeatElRef?: (playerId: string, el: HTMLDivElement | null) => void;
  tryAnotherDropIndex?: number | null;
  onTryAnotherCardSelect?: (idx: number) => void;
  onTryAnotherDropConfirm?: () => void;
}

export default function Game({ state, sendAction, readOnly = false, onCardSelect, onPlayerSelect, onCommonCardClick, actionInProgress, onSeatElRef, tryAnotherDropIndex, onTryAnotherCardSelect, onTryAnotherDropConfirm }: Props) {
  return (
    <div style={{ overflow: 'visible', padding: '8px 0', position: 'relative', zIndex: 500 }}>
      <Table state={state} sendAction={sendAction} readOnly={readOnly} onCardSelect={onCardSelect} onPlayerSelect={onPlayerSelect} onCommonCardClick={onCommonCardClick} actionInProgress={actionInProgress} onSeatElRef={onSeatElRef} tryAnotherDropIndex={tryAnotherDropIndex} onTryAnotherCardSelect={onTryAnotherCardSelect} onTryAnotherDropConfirm={onTryAnotherDropConfirm} />
    </div>
  );
}
