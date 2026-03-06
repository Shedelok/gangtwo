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
}

export default function Game({ state, sendAction, readOnly = false, onCardSelect, onPlayerSelect, onCommonCardClick, actionInProgress, onSeatElRef }: Props) {
  return (
    <div style={{ overflowX: 'auto', padding: '8px 0' }}>
      <Table state={state} sendAction={sendAction} readOnly={readOnly} onCardSelect={onCardSelect} onPlayerSelect={onPlayerSelect} onCommonCardClick={onCommonCardClick} actionInProgress={actionInProgress} onSeatElRef={onSeatElRef} />
    </div>
  );
}
