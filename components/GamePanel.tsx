import React from 'react';
import EmulatorScreen from './EmulatorScreen';
import PartyDisplay from './PartyDisplay';
import Controls from './Controls';
import RomLoader from './RomLoader';
import type { PartyMember, GameAction } from '../types';
import SaveIcon from './icons/SaveIcon';
import LoadIcon from './icons/LoadIcon';

interface GamePanelProps {
  party: PartyMember[];
  gameScreenUrl: string | null;
  lastAction: GameAction | null;
  isRomLoaded: boolean;
  onLoadRom: (file: File) => Promise<void>;
  onSaveState: () => void;
  onLoadState: () => void;
}

const GamePanel: React.FC<GamePanelProps> = ({ 
  party, 
  gameScreenUrl, 
  lastAction, 
  isRomLoaded, 
  onLoadRom,
  onSaveState,
  onLoadState,
}) => {
  return (
    <div className="h-full flex flex-col items-center space-y-4 overflow-y-auto">
      <div className="w-full flex-shrink-0">
        {isRomLoaded ? (
          <div className="relative">
            <EmulatorScreen imageUrl={gameScreenUrl} />
            <div className="absolute top-2 right-2 flex items-center space-x-2">
              <button 
                onClick={onSaveState} 
                className="p-2 bg-neutral-900/60 backdrop-blur-sm rounded-full hover:bg-neutral-700 transition-colors" 
                title="Save State" 
                aria-label="Save State"
              >
                <SaveIcon className="w-5 h-5 text-neutral-200" />
              </button>
              <button 
                onClick={onLoadState} 
                className="p-2 bg-neutral-900/60 backdrop-blur-sm rounded-full hover:bg-neutral-700 transition-colors" 
                title="Load State" 
                aria-label="Load State"
              >
                <LoadIcon className="w-5 h-5 text-neutral-200" />
              </button>
            </div>
          </div>
        ) : (
          <RomLoader onLoadRom={onLoadRom} />
        )}
      </div>
      {isRomLoaded && (
        <>
          <div className="w-full flex-shrink-0">
            <PartyDisplay party={party} />
          </div>
          <div className="w-full flex-shrink-0 mt-auto">
            <Controls lastAction={lastAction} />
          </div>
        </>
      )}
    </div>
  );
};

export default GamePanel;