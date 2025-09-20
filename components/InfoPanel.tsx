import React from 'react';
import type { GameAction, AIState } from '../types';
import { AIState as AIStateEnum } from '../types';
import BrainIcon from './icons/BrainIcon';
import KeyboardIcon from './icons/KeyboardIcon';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';

interface InfoPanelProps {
  reasoning: string;
  keyPresses: GameAction[];
  aiState: AIState;
  onToggleAI: () => void;
}

const PanelCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string; }> = ({ icon, title, children, className = '' }) => (
    <div className={`bg-neutral-900 border border-border-color rounded-lg flex flex-col ${className}`}>
        <div className="flex items-center space-x-2 p-3 border-b border-border-color">
            {icon}
            <h3 className="font-mono text-sm font-bold text-neutral-400">{title}</h3>
        </div>
        <div className="p-4 text-sm text-neutral-300 flex-grow overflow-y-auto">
            {children}
        </div>
    </div>
);

const KeyPressDisplay: React.FC<{ press: GameAction }> = ({ press }) => {
    const isArrow = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(press);
    const isA = press === 'A';

    let content: React.ReactNode;

    if (isArrow) {
        const rotations: Record<string, string> = { 'UP': '-rotate-90', 'DOWN': 'rotate-90', 'LEFT': 'rotate-180', 'RIGHT': '' };
        content = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-neutral-300 ${rotations[press]}`}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.7a.75.75 0 00-1.1 1.1l3.5 3.5a.75.75 0 001.1 0l3.5-3.5a.75.75 0 00-1.1-1.1l-1.95 1.95V6.75z" clipRule="evenodd" /></svg>;
    } else if (press === 'A' || press === 'B') {
        content = press;
    } else {
        content = press.charAt(0);
    }
    
    return (
        <div className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-lg
            ${isA ? 'bg-pink-500 text-white' : 'bg-neutral-800 text-neutral-300'}
        `}>
            {content}
        </div>
    );
};

const AIStatus: React.FC<{aiState: AIState, onToggle: () => void}> = ({aiState, onToggle}) => {
    const isRunning = aiState === AIStateEnum.RUNNING || aiState === AIStateEnum.THINKING;
    
    let text = 'AI is Idle.';
    let textColor = 'text-neutral-400';
    if (aiState === AIStateEnum.THINKING) {
        text = '... GPT-5 is thinking ...';
        textColor = 'text-brand-blue animate-pulse';
    } else if (aiState === AIStateEnum.RUNNING) {
        text = 'AI is Running';
        textColor = 'text-brand-green';
    } else if (aiState === AIStateEnum.COMPLETED) {
        text = 'Objective Completed';
        textColor = 'text-green-400';
    }

    return (
        <div className="flex items-center justify-between p-2 font-mono text-sm bg-neutral-900 border border-border-color rounded-lg mt-auto">
            <span className="pl-2 text-xs text-neutral-500">II ▶</span>
            <div className={textColor}>{text}</div>
            <button onClick={onToggle} className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors" aria-label={isRunning ? "Stop AI" : "Start AI"}>
                { isRunning ? <StopIcon className="w-5 h-5 text-red-400" /> : <PlayIcon className="w-5 h-5 text-green-400" /> }
            </button>
        </div>
    );
}

const InfoPanel: React.FC<InfoPanelProps> = ({ reasoning, keyPresses, aiState, onToggleAI }) => {
  return (
    <div className="h-full flex flex-col space-y-4">
        <PanelCard
            icon={<BrainIcon className="w-5 h-5 text-neutral-500"/>}
            title="REASONING"
            className="flex-grow min-h-0"
        >
            <p className="leading-relaxed whitespace-pre-wrap">
                {aiState === AIStateEnum.IDLE ? "AI is waiting for instructions..." : reasoning}
            </p>
        </PanelCard>

        <PanelCard
            icon={<KeyboardIcon className="w-5 h-5 text-neutral-500"/>}
            title="KEY PRESS"
        >
            <div className="flex flex-wrap gap-2 min-h-[40px]">
                {keyPresses.slice(-12).map((press, i) => <KeyPressDisplay key={i} press={press} />)}
            </div>
        </PanelCard>
        
        <AIStatus aiState={aiState} onToggle={onToggleAI} />
    </div>
  );
};

export default InfoPanel;