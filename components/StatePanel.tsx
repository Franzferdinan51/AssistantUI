import React, { useState } from 'react';
import type { StatePanelProps } from '../types';
import DragHandleIcon from './icons/DragHandleIcon';
import DataVisualizationPanel from './DataVisualizationPanel';
import Minimap from './Minimap';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

const PanelCard: React.FC<{ title: string; children: React.ReactNode; headerExtra?: React.ReactNode; className?: string }> = ({ title, children, headerExtra, className }) => (
    <div className={`bg-neutral-900 border border-border-color rounded-lg flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-border-color">
            <h3 className="font-mono text-sm font-bold text-neutral-400">{title}</h3>
            {headerExtra}
        </div>
        <div className="p-4 text-sm text-neutral-300">
            {children}
        </div>
    </div>
);


const StatePanel: React.FC<StatePanelProps> = ({ 
    objectives, 
    inventory, 
    inventoryTitle, 
    mapInfo,
    money, 
    onReorderObjectives,
    achievements,
    playerStats,
    justCompletedObjectiveIds,
    onToggleObjective,
    onDeleteObjective,
    onCreateObjective,
}) => {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [newObjectiveText, setNewObjectiveText] = useState('');

  const handleCreateObjective = () => {
    if (newObjectiveText.trim()) {
      onCreateObjective(newObjectiveText.trim());
      setNewObjectiveText('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateObjective();
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: number) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) {
        setDraggedId(null);
        return;
    }
    const draggedIndex = objectives.findIndex(obj => obj.id === draggedId);
    const targetIndex = objectives.findIndex(obj => obj.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newObjectives = [...objectives];
    const [draggedItem] = newObjectives.splice(draggedIndex, 1);
    newObjectives.splice(targetIndex, 0, draggedItem);
    onReorderObjectives(newObjectives);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto">
      <PanelCard title="DATA VISUALIZATION" className="flex-shrink-0">
        <DataVisualizationPanel achievements={achievements} stats={playerStats} />
      </PanelCard>

      <PanelCard title="OBJECTIVES">
        <div className="space-y-2">
          <ul className="space-y-1">
            {objectives.map(obj => {
              const isJustCompleted = justCompletedObjectiveIds.has(obj.id);
              return (
                <li 
                  key={obj.id} 
                  className={`flex items-center space-x-3 p-1.5 rounded-md transition-all duration-1000 group ${draggedId === obj.id ? 'opacity-50 bg-neutral-800' : ''} ${isJustCompleted ? 'bg-green-glow/20' : ''}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, obj.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, obj.id)}
                  onDragEnd={handleDragEnd}
                >
                  <DragHandleIcon className="w-5 h-5 text-neutral-700 group-hover:text-neutral-400 transition-colors flex-shrink-0 cursor-grab"/>
                  <input
                    type="checkbox"
                    checked={obj.completed}
                    onChange={() => onToggleObjective(obj.id)}
                    className="flex-shrink-0 w-5 h-5 bg-neutral-800 border-neutral-700 rounded text-cyan-glow focus:ring-cyan-glow focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
                  />
                  <p className={`flex-grow text-neutral-300 text-sm leading-snug ${obj.completed ? 'line-through text-neutral-500' : ''}`}>{obj.text}</p>
                  <button onClick={() => onDeleteObjective(obj.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-500 transition-all" aria-label="Delete objective">
                      <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
            {objectives.length === 0 && <p className="text-neutral-600 text-sm px-2 py-4 text-center">No objectives set. Add one below!</p>}
          </ul>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="text"
              value={newObjectiveText}
              onChange={(e) => setNewObjectiveText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="e.g. Find the legendary sword"
              className="flex-grow p-2 h-9 bg-neutral-800 border border-neutral-700 rounded-md text-sm placeholder:text-neutral-600 focus:ring-1 focus:ring-cyan-glow focus:border-cyan-glow outline-none"
            />
            <button 
              onClick={handleCreateObjective}
              className="flex-shrink-0 p-2 h-9 bg-cyan-glow rounded-md text-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-500"
              aria-label="Add objective"
              disabled={!newObjectiveText.trim()}
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </PanelCard>

      <PanelCard 
        title={inventoryTitle}
        headerExtra={<span className="font-mono text-sm text-yellow-400">₽ {money.toLocaleString()}</span>}
      >
        <div className="grid grid-cols-5 gap-3">
          {inventory.map(item => (
            <div key={item.name} className="bg-neutral-800 rounded-md p-2 text-center aspect-square flex flex-col justify-center items-center">
              {item.icon ? (
                <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
              ) : (
                <div className="text-xs text-neutral-500">x{item.quantity}</div>
              )}
              <div className="text-xs font-bold mt-1 truncate w-full">{item.name}</div>
            </div>
          ))}
          {[...Array(Math.max(0, 15 - inventory.length))].map((_, i) => (
             <div key={i} className="bg-neutral-800/50 rounded-md p-2 aspect-square flex flex-col justify-center items-center">
                 <div className="w-4 h-4 border-2 border-dashed border-neutral-700 rounded"></div>
             </div>
          ))}
        </div>
      </PanelCard>
      
      <PanelCard 
        title={mapInfo.name.toUpperCase()}
        headerExtra={<span className="font-mono text-sm text-neutral-500">[{mapInfo.coords.join(', ')}]</span>}
      >
          <Minimap mapData={mapInfo} />
      </PanelCard>
    </div>
  );
};

export default StatePanel;