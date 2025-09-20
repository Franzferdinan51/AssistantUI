import React from 'react';
import type { MapData, PointOfInterest } from '../types';
import PlayerIcon from './icons/PlayerIcon';
import MapPinIcon from './icons/MapPinIcon';

interface MinimapProps {
  mapData: MapData;
}

// Define the boundaries of the game world coordinates.
// This is an assumption; in a real scenario, this might come from the backend
// or be configured based on the specific game.
const WORLD_BOUNDS = { x: { min: -50, max: 50 }, y: { min: -50, max: 50 } };
const GRID_SIZE = 20; // 20x20 grid

const Minimap: React.FC<MinimapProps> = ({ mapData }) => {
  const { coords, pointsOfInterest, explorationGrid } = mapData;

  const getGridPosition = (gameCoords: [number, number]): { row: number; col: number } => {
    const [x, y] = gameCoords;
    const worldWidth = WORLD_BOUNDS.x.max - WORLD_BOUNDS.x.min;
    const worldHeight = WORLD_BOUNDS.y.max - WORLD_BOUNDS.y.min;

    // Normalize coordinates to a 0-1 range
    const normalizedX = (x - WORLD_BOUNDS.x.min) / worldWidth;
    const normalizedY = (y - WORLD_BOUNDS.y.min) / worldHeight;
    
    // Scale to grid size and clamp within bounds
    const col = Math.max(1, Math.min(GRID_SIZE, Math.floor(normalizedX * GRID_SIZE) + 1));
    const row = Math.max(1, Math.min(GRID_SIZE, Math.floor(normalizedY * GRID_SIZE) + 1));

    return { row, col };
  };

  // FIX: Updated switch cases to match the valid PointOfInterest types.
  const getPoiColor = (type: PointOfInterest['type']) => {
    switch (type) {
      case 'quest_location': return 'text-red-500';
      case 'heal_location': return 'text-pink-500';
      case 'shop': return 'text-blue-400';
      case 'objective': return 'text-yellow-400';
      default: return 'text-neutral-500';
    }
  };

  const playerPos = getGridPosition(coords);

  return (
    <div className="bg-black aspect-square rounded-md p-1 relative">
       {/* Exploration Layer */}
      {explorationGrid && explorationGrid.length > 0 && (
        <div
          className="absolute inset-1 grid w-[calc(100%-2px)] h-[calc(100%-2px)] pointer-events-none"
          style={{
            gridTemplateColumns: `repeat(${explorationGrid[0].length}, 1fr)`,
            gridTemplateRows: `repeat(${explorationGrid.length}, 1fr)`,
          }}
        >
          {explorationGrid.map((row, y) =>
            row.map((cell, x) =>
              cell > 0 ? (
                <div
                  key={`${y}-${x}`}
                  className="bg-cyan-glow/10"
                  style={{ gridRow: y + 1, gridColumn: x + 1 }}
                ></div>
              ) : null
            )
          )}
        </div>
      )}

      {/* Grid for positioning */}
      <div 
        className="grid w-full h-full relative"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          backgroundSize: `calc(100% / ${GRID_SIZE}) calc(100% / ${GRID_SIZE})`,
          backgroundImage: `linear-gradient(to right, #21262d 1px, transparent 1px), linear-gradient(to bottom, #21262d 1px, transparent 1px)`,
        }}
      >
        {pointsOfInterest.map((poi, index) => {
          const pos = getGridPosition(poi.coords);
          return (
            <div 
              key={`${poi.name}-${index}`}
              className="relative flex items-center justify-center group"
              style={{ gridRow: pos.row, gridColumn: pos.col }}
            >
              <MapPinIcon className={`w-3 h-3 md:w-4 md:h-4 ${getPoiColor(poi.type)}`} />
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-950 text-white text-xs font-mono px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {poi.name} ({poi.type})
              </div>
            </div>
          );
        })}

        <div 
          className="relative flex items-center justify-center transition-all duration-500" 
          style={{ 
            gridRow: playerPos.row, 
            gridColumn: playerPos.col,
          }}
        >
          <PlayerIcon className="w-4 h-4 md:w-5 md:h-5 text-cyan-glow animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default Minimap;