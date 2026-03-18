import { jsx as _jsx } from "react/jsx-runtime";
import Table from './Table';
export default function Game({ state, sendAction, readOnly = false, onCardSelect, onPlayerSelect, onCommonCardClick, actionInProgress, onSeatElRef }) {
    return (_jsx("div", { style: { overflowX: 'auto', padding: '8px 0' }, children: _jsx(Table, { state: state, sendAction: sendAction, readOnly: readOnly, onCardSelect: onCardSelect, onPlayerSelect: onPlayerSelect, onCommonCardClick: onCommonCardClick, actionInProgress: actionInProgress, onSeatElRef: onSeatElRef }) }));
}
