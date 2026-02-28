import React from 'react';
import type { ClientGameState, ClientAction } from '@shared/types';
import Table from './Table';

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
  readOnly?: boolean;
}

export default function Game({ state, sendAction, readOnly = false }: Props) {
  return (
    <div style={{ overflowX: 'auto', padding: '8px 0' }}>
      <Table state={state} sendAction={sendAction} readOnly={readOnly} />
    </div>
  );
}
