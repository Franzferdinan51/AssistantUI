import React from 'react';
import AchievementTimeline from './BadgeTimeline';
import type { Achievement } from '../types';
import CogIcon from './icons/CogIcon';

interface HeaderProps {
  achievements: Achievement[];
  onOpenSettings: () => void;
  runtime: string;
  steps: number;
  saveStatus: 'saving' | 'saved' | '';
}

const StatItem: React.FC<{ label: string; value: string; live?: boolean }> = ({ label, value, live = false }) => (
  <div className="text-right">
    <div className="text-xs text-neutral-400">{label}</div>
    <div className="text-lg font-mono font-bold text-neutral-100 flex items-center justify-end">
      {live && <span className="mr-2 text-xs font-sans text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full">LIVE</span>}
      {value}
    </div>
  </div>
);

const Header: React.FC<HeaderProps> = ({ achievements, onOpenSettings, runtime, steps, saveStatus }) => {
  return (
    <header className="flex-shrink-0 bg-neutral-900/50 backdrop-blur-sm border-b border-border-color">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-3xl font-bold font-display text-gray-100 tracking-wider">
          AI Game Assistant
        </h1>
        <div className="flex items-center space-x-6">
          <div className="text-right text-xs text-neutral-500 w-20 transition-opacity duration-500 font-mono">
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved!'}
          </div>
          <StatItem label="Total Runtime" value={runtime} />
          <StatItem label="Steps" value={steps.toLocaleString()} />
          <StatItem label="Next Criticism" value="T-7" />
          <StatItem label="Next Summary" value="T-7" live={true} />
          <button onClick={onOpenSettings} className="text-neutral-400 hover:text-white transition-colors" aria-label="Open Settings">
            <CogIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <AchievementTimeline achievements={achievements} />
    </header>
  );
};

export default Header;