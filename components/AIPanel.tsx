import React, { useRef, useEffect } from 'react';
import { AIState } from '../types';
import type { GameAction, ChatMessage } from '../types';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import SendIcon from './icons/SendIcon';
import BrainIcon from './icons/BrainIcon';
import KeyboardIcon from './icons/KeyboardIcon';
import KeyPressHistory from './KeyPressHistory';
import ChatBubbleIcon from './icons/ChatBubbleIcon';

interface AIPanelProps {
  aiState: AIState;
  aiGoal: string;
  currentReasoning: string;
  actionHistory: GameAction[];
  chatHistory: ChatMessage[];
  chatInput: string;
  isChatting: boolean;
  isRomLoaded: boolean;
  onScreenText: string;
  onGoalChange: (goal: string) => void;
  onStart: () => void;
  onStop: () => void;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ 
  aiState, 
  aiGoal,
  currentReasoning,
  actionHistory,
  chatHistory,
  chatInput,
  isChatting,
  isRomLoaded,
  onScreenText,
  onGoalChange, 
  onStart, 
  onStop,
  onChatInputChange,
  onSendMessage,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reasoningContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reasoningContainerRef.current) {
        reasoningContainerRef.current.scrollTop = reasoningContainerRef.current.scrollHeight;
    }
  }, [currentReasoning]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatting]);

  const isRunning = aiState === AIState.RUNNING || aiState === AIState.THINKING;

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim() && !isChatting) {
        onSendMessage();
      }
    }
  };

  const getChatMessageColor = (sender: ChatMessage['sender']) => {
    switch(sender) {
      case 'user': return 'bg-cyan-800';
      case 'ai': return 'bg-neutral-700';
      case 'system': return 'bg-neutral-800 border border-neutral-700 italic';
      default: return 'bg-neutral-700';
    }
  }

  return (
    <div className="w-full h-full bg-neutral-900 border border-border-color rounded-lg flex flex-col">
      <div className="p-4 border-b border-border-color flex-shrink-0">
        <h2 className="font-display font-bold text-lg">AI Dashboard</h2>
      </div>

      {/* Main content area */}
      <div className="flex-grow flex flex-col p-4 overflow-hidden space-y-4">
        
        <div className="flex-shrink-0">
          <label htmlFor="ai-goal" className="block text-sm font-semibold text-neutral-300 mb-2">AI Objective</label>
          <textarea
            id="ai-goal"
            rows={2}
            value={aiGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            placeholder="e.g., 'Defeat the final boss and save the world'"
            className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm placeholder:text-neutral-600 focus:ring-1 focus:ring-cyan-glow focus:border-cyan-glow outline-none disabled:bg-neutral-800/50 disabled:text-neutral-500"
            disabled={isRunning || !isRomLoaded}
          />
          <p className="text-xs text-neutral-500 mt-2">This is the main goal. You can add and prioritize specific tasks in the Objectives panel.</p>
        </div>

        {/* Reasoning Panel */}
        <div className="flex-grow flex flex-col bg-neutral-950/50 rounded-lg overflow-hidden border border-border-color min-h-0">
          <div className="flex items-center space-x-2 p-3 border-b border-border-color bg-neutral-900 flex-shrink-0">
            <BrainIcon className="w-5 h-5 text-neutral-500"/>
            <h3 className="font-mono text-sm font-bold text-neutral-400">REASONING</h3>
          </div>
          <div ref={reasoningContainerRef} className="flex-grow p-4 space-y-2 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-neutral-300">
            {currentReasoning}
          </div>
        </div>
        
        {/* On-Screen Text Panel */}
        <div className="flex-shrink-0">
            <div className="bg-neutral-950/50 rounded-lg border border-border-color">
                <div className="flex items-center space-x-2 p-3 border-b border-border-color bg-neutral-900">
                    <ChatBubbleIcon className="w-5 h-5 text-neutral-500"/>
                    <h3 className="font-mono text-sm font-bold text-neutral-400">ON-SCREEN TEXT</h3>
                </div>
                <div className="p-4 font-pixel text-lg text-cyan-glow min-h-[60px]">
                    {onScreenText || <span className="text-neutral-600 text-base font-sans italic">No text detected.</span>}
                </div>
            </div>
        </div>

      </div>

      {/* Footer with Chat and Controls */}
      <div className="flex-shrink-0 border-t border-border-color bg-neutral-950/50">
        {/* Chat Area - limited height and scrollable */}
        <div className="flex flex-col max-h-60 border-b border-border-color">
            <div className="px-4 py-2 bg-neutral-900 text-xs font-mono text-neutral-400 flex-shrink-0">CHAT LOG</div>
            <div ref={chatContainerRef} className="flex-grow p-3 space-y-3 overflow-y-auto text-sm">
              {chatHistory.length === 0 && <span className="text-neutral-600 text-xs">System messages and chat will appear here...</span>}
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-[85%] ${getChatMessageColor(msg.sender)}`}>
                    {msg.sender === 'system' && <span className='text-neutral-500 block text-xs'>System:</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                  <div className="flex items-start">
                      <div className="px-3 py-2 rounded-lg bg-neutral-700">
                          <span className="animate-pulse">...</span>
                      </div>
                  </div>
              )}
            </div>
        </div>
        
        {/* Buttons and Chat Input */}
        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask a question..."
                disabled={isChatting}
                className="flex-grow p-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm placeholder:text-neutral-600 focus:ring-1 focus:ring-cyan-glow focus:border-cyan-glow outline-none disabled:bg-neutral-800/50"
              />
              <button 
                  onClick={onSendMessage} 
                  disabled={!chatInput.trim() || isChatting}
                  className="p-2 bg-cyan-glow rounded-md text-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-500"
                  aria-label="Send message"
              >
                  <SendIcon className="w-6 h-6" />
              </button>
          </div>
          <button
            onClick={isRunning ? onStop : onStart}
            disabled={ isRunning ? false : (!aiGoal.trim() || !isRomLoaded) }
            className={`w-full flex items-center justify-center p-3 rounded-md font-bold text-lg transition-all duration-300
              ${isRunning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-glow hover:opacity-80 text-neutral-950'}
              disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed`}
          >
            {isRunning ? <StopIcon className="w-6 h-6 mr-2" /> : <PlayIcon className="w-6 h-6 mr-2" />}
            {isRunning ? (aiState === AIState.THINKING ? 'Thinking...' : 'Stop AI') : 'Start AI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;