import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import AIPanel from './components/AIPanel';
import GamePanel from './components/GamePanel';
import StatePanel from './components/StatePanel';
import SettingsModal from './components/SettingsModal';
// FIX: Added PlayerStats to the import list to resolve "Cannot find name" error.
import type { Achievement, PartyMember, Objective, Item, GameAction, AIState, AILog, ChatMessage, AppSettings, AiModel, PlayerStats, MapData } from './types';
import { AIState as AIStateEnum } from './types';
import { fetchAvailableModels, getAIThoughtAndAction, getChatResponse } from './services/geminiService';
import { getScreen, sendAction, getParty, getGameState, loadRom, saveState as saveGameState, loadState as loadGameState } from './services/backendService';
import { useInterval } from './hooks/useInterval';

const SAVE_KEY = 'ai-game-assistant-save-v1';
const STREAM_INTERVAL_MS = 250; // approx 4 FPS for the screen stream
const IDLE_STATE_REFRESH_MS = 2000;

const App: React.FC = () => {
  const [aiState, setAiState] = useState<AIState>(AIStateEnum.IDLE);
  const [gameScreenUrl, setGameScreenUrl] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);
  const [isRomLoaded, setIsRomLoaded] = useState(false);
  
  // Dynamic Game State
  const [party, setParty] = useState<PartyMember[]>([]);
  const [mapInfo, setMapInfo] = useState<MapData>({ name: 'Loading...', coords: [0, 0], pointsOfInterest: []});
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: 1, text: 'Complete the tutorial quest', completed: false },
    { id: 2, text: 'Visit the capital city', completed: false },
    { id: 3, text: 'Find the hidden ancient ruins', completed: false },
  ]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ runtime: '00:00:00', steps: 0, money: 0 });
  const [dialogue, setDialogue] = useState('');
  
  // State for AIPanel
  const [aiGoal, setAiGoal] = useState<string>('Defeat the final boss and save the world.');
  const [currentReasoning, setCurrentReasoning] = useState<string>('Please load a ROM to begin.');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // State for Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    aiActionInterval: 4000,
    backendUrl: 'http://localhost:5000',
    aiProvider: 'google',
    googleApiKey: '',
    openrouterApiKey: '',
    lmStudioUrl: 'http://localhost:1234',
    selectedModel: '',
  });
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [isModelListLoading, setIsModelListLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [justCompletedObjectiveIds, setJustCompletedObjectiveIds] = useState<Set<number>>(new Set());


  const currentScreenBlob = useRef<Blob | null>(null);
  const messageIdCounter = useRef(0);
  const prevObjectivesRef = useRef<Objective[]>([]);
  const nextObjectiveId = useRef(objectives.length > 0 ? Math.max(...objectives.map(o => o.id)) + 1 : 1);
  
  const addChatMessage = useCallback((text: string, sender: 'user' | 'ai' | 'system') => {
    const message: ChatMessage = { id: messageIdCounter.current++, sender, text };
    setChatHistory(prev => [...prev, message]);
  }, []);

  // Effect to detect and handle objective completion
  useEffect(() => {
    const prevObjectives = prevObjectivesRef.current;
    
    if (prevObjectives.length > 0 || objectives.some(o => o.completed)) {
        const newlyCompletedObjectives = objectives.filter(currentObj => {
            const prevObj = prevObjectives.find(p => p.id === currentObj.id);
            return currentObj.completed && (!prevObj || !prevObj.completed);
        });

        if (newlyCompletedObjectives.length > 0) {
            newlyCompletedObjectives.forEach(obj => {
                addChatMessage(`Objective complete: '${obj.text}'`, 'system');
                setJustCompletedObjectiveIds(prev => new Set(prev).add(obj.id));
                setTimeout(() => {
                    setJustCompletedObjectiveIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(obj.id);
                        return newSet;
                    });
                }, 2000);
            });
        }
    }
    prevObjectivesRef.current = objectives;
  }, [objectives, addChatMessage]);

  const handleReorderObjectives = (newObjectives: Objective[]) => {
    setObjectives(newObjectives);
  };

  const handleToggleObjective = (id: number) => {
    setObjectives(prev => prev.map(obj => obj.id === id ? { ...obj, completed: !obj.completed } : obj));
  };

  const handleDeleteObjective = (id: number) => {
    setObjectives(prev => prev.filter(obj => obj.id !== id));
  };

  const handleCreateObjective = (text: string) => {
    if (!text.trim()) return;
    const newObjective: Objective = {
      id: nextObjectiveId.current++,
      text,
      completed: false
    };
    setObjectives(prev => [...prev, newObjective]);
  };

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
        const savedStateJSON = localStorage.getItem(SAVE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            
            if (savedState.appSettings) setAppSettings(savedState.appSettings);
            if (savedState.aiGoal) setAiGoal(savedState.aiGoal);
            if (savedState.objectives) {
              setObjectives(savedState.objectives);
              nextObjectiveId.current = savedState.objectives.length > 0 ? Math.max(...savedState.objectives.map((o: Objective) => o.id)) + 1 : 1
            }
            if (savedState.chatHistory) setChatHistory(savedState.chatHistory);
            if (savedState.actionHistory) setActionHistory(savedState.actionHistory);
            if (savedState.achievements) setAchievements(savedState.achievements);
            if (savedState.party) setParty(savedState.party);
            if (savedState.inventory) setInventory(savedState.inventory);
            if (savedState.mapInfo) setMapInfo(savedState.mapInfo);
            if (savedState.playerStats) setPlayerStats(savedState.playerStats);
            
            addChatMessage('Session restored from previous state.', 'system');
        }
    } catch (error) {
        console.error("Failed to load state from localStorage", error);
        addChatMessage('Could not restore previous session.', 'system');
    }
  }, [addChatMessage]);

  // Autosave state to localStorage
  const saveState = useCallback(() => {
    setSaveStatus('saving');
    try {
        const stateToSave = {
            appSettings,
            aiGoal,
            objectives,
            chatHistory,
            actionHistory,
            achievements,
            party,
            inventory,
            mapInfo,
            playerStats
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
        setSaveStatus('');
    }
  }, [appSettings, aiGoal, objectives, chatHistory, actionHistory, achievements, party, inventory, mapInfo, playerStats]);

  useInterval(saveState, 15000); // Save every 15 seconds

  useEffect(() => {
    const loadModels = async () => {
      if (
        (appSettings.aiProvider === 'google' && !appSettings.googleApiKey) ||
        (appSettings.aiProvider === 'openrouter' && !appSettings.openrouterApiKey) ||
        (appSettings.aiProvider === 'lmstudio' && !appSettings.lmStudioUrl)
      ) {
        setAvailableModels([]);
        return;
      }

      setIsModelListLoading(true);
      setAvailableModels([]);
      try {
        const models = await fetchAvailableModels(appSettings);
        setAvailableModels(models);
        if (models.length > 0 && !models.find(m => m.id === appSettings.selectedModel)) {
            setAppSettings(prev => ({...prev, selectedModel: models[0].id }));
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        addChatMessage(`Failed to load models for ${appSettings.aiProvider}.`, 'system');
      } finally {
        setIsModelListLoading(false);
      }
    };

    loadModels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSettings.aiProvider, appSettings.googleApiKey, appSettings.openrouterApiKey, appSettings.lmStudioUrl]);

  const refreshFullGameState = useCallback(async () => {
    if (!isRomLoaded) return;
    try {
      const [screenBlob, partyData, gameState] = await Promise.all([
        getScreen(appSettings.backendUrl),
        getParty(appSettings.backendUrl),
        getGameState(appSettings.backendUrl)
      ]);
      
      currentScreenBlob.current = screenBlob;
      setGameScreenUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return URL.createObjectURL(screenBlob);
      });

      if (partyData) setParty(partyData);
      if (gameState) {
        setParty(gameState.party);
        setAchievements(gameState.achievements);
        setInventory(gameState.inventory);
        setMapInfo(gameState.map);
        setPlayerStats(gameState.stats);
        setDialogue(gameState.dialogue || '');
      }

    } catch (error) {
      console.error(error);
      setAiState(AIStateEnum.IDLE); 
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addChatMessage(`Connection Error: ${errorMessage}`, 'system');
    }
  }, [addChatMessage, isRomLoaded, appSettings.backendUrl]);
  
  const refreshScreen = useCallback(async () => {
    if (!isRomLoaded) return;
    try {
        const screenBlob = await getScreen(appSettings.backendUrl);
        currentScreenBlob.current = screenBlob;
        setGameScreenUrl(prevUrl => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return URL.createObjectURL(screenBlob);
        });
    } catch (error) {
        // Silently fail for the stream to avoid spamming user with errors
        console.warn("Screen stream failed a frame:", error);
    }
  }, [isRomLoaded, appSettings.backendUrl]);

  const aiTick = useCallback(async () => {
    if (aiState !== AIStateEnum.RUNNING || !isRomLoaded) return;
    
    setAiState(AIStateEnum.THINKING);

    // Get a full, fresh update of the entire game state before thinking
    await refreshFullGameState();
    
    if (!currentScreenBlob.current) {
        console.error("No screen data available for AI to process.");
        addChatMessage("Could not retrieve game screen.", 'system');
        setAiState(AIStateEnum.RUNNING);
        return;
    }

    const currentGoal = aiGoal || "Explore the world.";
    const { reasoning, action } = await getAIThoughtAndAction(appSettings, currentScreenBlob.current, currentGoal, objectives, actionHistory, mapInfo, dialogue);
    
    setCurrentReasoning(reasoning);
    setActionHistory(prev => [...prev, action]);

    await sendAction(appSettings.backendUrl, action);
    
    setAiState(AIStateEnum.RUNNING);

  }, [aiState, actionHistory, refreshFullGameState, aiGoal, objectives, addChatMessage, isRomLoaded, appSettings, mapInfo, dialogue]);

  // Main AI action loop
  useInterval(aiTick, aiState === AIStateEnum.RUNNING && isRomLoaded ? appSettings.aiActionInterval : null);
  
  // Constant screen refresh for visual feedback
  useInterval(refreshScreen, isRomLoaded && aiState !== AIStateEnum.THINKING ? STREAM_INTERVAL_MS : null);

  // Slower state refresh for panels when AI is idle
  useInterval(refreshFullGameState, aiState === AIStateEnum.IDLE && isRomLoaded ? IDLE_STATE_REFRESH_MS : null);

  const handleToggleAI = () => {
    if (!isRomLoaded) return;
    if (aiState === AIStateEnum.IDLE) {
      setActionHistory([]);
      setCurrentReasoning("AI is starting...");
      addChatMessage('AI starting...', 'system');
      setAiState(AIStateEnum.RUNNING);
    } else {
      addChatMessage('AI stopped by user.', 'system');
      setCurrentReasoning("AI stopped by user.");
      setAiState(AIStateEnum.IDLE);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    
    const userMessage = chatInput;
    addChatMessage(userMessage, 'user');
    setChatInput('');
    setIsChatting(true);

    // FIX: Corrected variable name from 'user_message' to 'userMessage'.
    const aiResponseText = await getChatResponse(appSettings, userMessage);
    
    addChatMessage(aiResponseText, 'ai');
    setIsChatting(false);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    if (newSettings.aiProvider !== appSettings.aiProvider) {
      newSettings.selectedModel = '';
    }
    setAppSettings(newSettings);
    setIsSettingsOpen(false);
    addChatMessage(`Settings updated. AI Provider: ${newSettings.aiProvider}.`, 'system');
  };

  const handleLoadRom = async (file: File) => {
    try {
        await loadRom(appSettings.backendUrl, file);
        setIsRomLoaded(true);
        setCurrentReasoning("Successfully loaded ROM. Ready for instructions.");
        addChatMessage(`Successfully loaded ${file.name}.`, 'system');
        await refreshFullGameState(); // Fetch the first screen and state immediately after loading.
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        addChatMessage(`Failed to load ROM: ${message}`, 'system');
        setIsRomLoaded(false);
        throw error; // Re-throw to let RomLoader component handle its UI state
    }
  };
  
  const handleSaveState = async () => {
    if (!isRomLoaded) return;
    try {
      await saveGameState(appSettings.backendUrl);
      addChatMessage('Game state saved.', 'system');
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      addChatMessage(`Failed to save state: ${message}`, 'system');
    }
  };

  const handleLoadState = async () => {
    if (!isRomLoaded) return;
    try {
      await loadGameState(appSettings.backendUrl);
      addChatMessage('Game state loaded.', 'system');
      await refreshFullGameState(); // Refresh screen immediately after loading
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      addChatMessage(`Failed to load state: ${message}`, 'system');
    }
  };


  return (
    <div className="h-screen w-full flex flex-col bg-neutral-950 font-sans overflow-hidden">
      <Header 
        achievements={achievements} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        runtime={playerStats.runtime}
        steps={playerStats.steps}
        saveStatus={saveStatus}
      />
      <main className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 p-4 min-h-0 overflow-y-auto">
        <div className="md:col-span-4 lg:col-span-3 min-h-0">
          <AIPanel
            aiState={aiState}
            aiGoal={aiGoal}
            currentReasoning={currentReasoning}
            actionHistory={actionHistory}
            chatHistory={chatHistory}
            chatInput={chatInput}
            isChatting={isChatting}
            isRomLoaded={isRomLoaded}
            onScreenText={dialogue}
            onGoalChange={setAiGoal}
            onStart={handleToggleAI}
            onStop={handleToggleAI}
            onChatInputChange={setChatInput}
            onSendMessage={handleSendMessage}
          />
        </div>
        <div className="md:col-span-8 lg:col-span-5 min-h-0">
          <GamePanel 
            party={party} 
            gameScreenUrl={gameScreenUrl} 
            lastAction={actionHistory.length > 0 ? actionHistory[actionHistory.length - 1] : null}
            isRomLoaded={isRomLoaded}
            onLoadRom={handleLoadRom}
            onSaveState={handleSaveState}
            onLoadState={handleLoadState}
          />
        </div>
        <div className="md:col-span-12 lg:col-span-4 min-h-0">
          <StatePanel 
            objectives={objectives}
            inventory={inventory}
            inventoryTitle="INVENTORY (Key Items)"
            mapInfo={mapInfo}
            money={playerStats.money}
            onReorderObjectives={handleReorderObjectives}
            achievements={achievements}
            playerStats={playerStats}
            justCompletedObjectiveIds={justCompletedObjectiveIds}
            onToggleObjective={handleToggleObjective}
            onDeleteObjective={handleDeleteObjective}
            onCreateObjective={handleCreateObjective}
          />
        </div>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={appSettings}
        onSave={handleSaveSettings}
        availableModels={availableModels}
        isModelListLoading={isModelListLoading}
      />
    </div>
  );
};

export default App;