
import React from 'react';
import type { GameAction } from '../types';

const KeyPressDisplay: React.FC<{ press: GameAction }> = ({ press }) => {
    // A simplified visual representation for key presses
    let content: React.ReactNode;
    switch(press) {
        case 'UP': content = '↑'; break;
        case 'DOWN': content = '↓'; break;
        case 'LEFT': content = '←'; break;
        case 'RIGHT': content = '→'; break;
        default: content = press.charAt(0);
    }

    return (
        <div className={`w-8 h-8 flex items-center justify-center rounded font-mono font-bold text-lg
            ${press === 'A' ? 'bg-green-500 text-white' : press === 'B' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'}
        `}>
            {content}
        </div>
    );
};

interface KeyPressHistoryProps {
    actions: GameAction[];
}

const KeyPressHistory: React.FC<KeyPressHistoryProps> = ({ actions }) => {
    return (
        <div className="flex flex-wrap gap-2 min-h-[40px]">
            {actions.slice(-12).map((press, i) => <KeyPressDisplay key={i} press={press} />)}
            {actions.length === 0 && <span className="text-neutral-600 text-xs">No actions taken yet.</span>}
        </div>
    );
};

export default KeyPressHistory;
