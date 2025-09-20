// FIX: Add 'RUNNING' to AIState enum for when the AI is actively playing.
export enum AIState {
  IDLE = 'idle',
  RUNNING = 'running',
  THINKING = 'thinking',
  COMPLETED = 'completed',
}

export type GameAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT';

export interface Achievement {
  name: string;
  iconUrl: string;
  time: string;
}

export interface PartyMember {
  name:string;
  spriteUrl: string;
  level: number;
  hp: {
    current: number;
    max: number;
  };
  types: string[];
}

export interface Objective {
  id: number;
  text: string;
  completed: boolean;
}

export interface Item {
  name: string;
  quantity: number;
  icon?: string; // TBD
}

// FIX: Define AILog for displaying AI thoughts and actions.
export interface AILog {
  id: number;
  type: 'action' | 'thought' | 'error' | 'info';
  message: string;
}

// FIX: Define ChatMessage for the AI chat interface.
export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai' | 'system';
  text: string;
}

export type AiProvider = 'google' | 'openrouter' | 'lmstudio';

export interface AiModel {
  id: string;
  name: string;
}

// FIX: Define AppSettings for the settings modal.
export interface AppSettings {
  aiActionInterval: number;
  backendUrl: string;
  // New AI settings
  aiProvider: AiProvider;
  googleApiKey: string;
  openrouterApiKey: string;
  lmStudioUrl: string;
  selectedModel: string;
}


export interface PlayerStats {
  runtime: string;
  steps: number;
  money: number;
}

// New interfaces for improved map data
export interface PointOfInterest {
  name: string;
  coords: [number, number];
  type: 'quest_location' | 'heal_location' | 'shop' | 'objective';
}

export interface MapData {
  name: string;
  coords: [number, number];
  pointsOfInterest: PointOfInterest[];
  explorationGrid?: number[][];
}

export interface GameState {
  achievements: Achievement[];
  inventory: Item[];
  map: MapData;
  party: PartyMember[];
  stats: PlayerStats;
  dialogue?: string; // Added to read on-screen text
}

// Add new props to StatePanelProps for data visualization
export interface StatePanelProps {
  objectives: Objective[];
  inventory: Item[];
  inventoryTitle: string;
  mapInfo: MapData;
  money: number;
  achievements: Achievement[];
  playerStats: PlayerStats;
  onReorderObjectives: (newObjectives: Objective[]) => void;
  justCompletedObjectiveIds: Set<number>;
  onToggleObjective: (id: number) => void;
  onDeleteObjective: (id: number) => void;
  onCreateObjective: (text: string) => void;
}