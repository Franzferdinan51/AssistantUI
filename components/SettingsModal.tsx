import React, { useState, useEffect } from 'react';
import type { AppSettings, AiProvider, AiModel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  availableModels: AiModel[];
  isModelListLoading: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave,
  availableModels,
  isModelListLoading
}) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave(settings);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };
  
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ 
      ...prev, 
      aiProvider: e.target.value as AiProvider, 
      selectedModel: '' 
    }));
  };
  
  if (!isOpen) {
    return null;
  }

  const inputClasses = "w-full p-2 bg-neutral-800 border border-neutral-700 rounded-md placeholder:text-neutral-600 focus:ring-1 focus:ring-cyan-glow focus:border-cyan-glow outline-none";
  const labelClasses = "block text-sm font-medium text-neutral-300 mb-2";

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-neutral-900 rounded-lg shadow-2xl shadow-black/50 border border-neutral-800 w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 id="settings-title" className="text-xl font-bold font-display">Settings</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white" aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          <div className="border-b border-neutral-800 pb-6">
            <h3 className="text-lg font-semibold text-neutral-200 mb-4">AI Configuration</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="aiProvider" className={labelClasses}>AI Provider</label>
                <select id="aiProvider" value={settings.aiProvider} onChange={handleProviderChange} className={inputClasses}>
                  <option value="google">Google Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="lmstudio">LM Studio</option>
                </select>
              </div>

              {settings.aiProvider === 'google' && (
                 <div>
                  <label htmlFor="googleApiKey" className={labelClasses}>Google API Key</label>
                  <input type="password" id="googleApiKey" value={settings.googleApiKey} onChange={handleChange} className={inputClasses} placeholder="Enter your Google API Key" />
                </div>
              )}
              {settings.aiProvider === 'openrouter' && (
                 <div>
                  <label htmlFor="openrouterApiKey" className={labelClasses}>OpenRouter API Key</label>
                  <input type="password" id="openrouterApiKey" value={settings.openrouterApiKey} onChange={handleChange} className={inputClasses} placeholder="Enter your OpenRouter API Key" />
                </div>
              )}
              {settings.aiProvider === 'lmstudio' && (
                <div>
                  <label htmlFor="lmStudioUrl" className={labelClasses}>LM Studio Server URL</label>
                  <input type="text" id="lmStudioUrl" value={settings.lmStudioUrl} onChange={handleChange} className={inputClasses} placeholder="http://localhost:1234" />
                </div>
              )}

              <div>
                <label htmlFor="selectedModel" className={labelClasses}>AI Model</label>
                <select id="selectedModel" value={settings.selectedModel} onChange={handleChange} className={inputClasses} disabled={isModelListLoading || availableModels.length === 0}>
                  {isModelListLoading && <option>Loading models...</option>}
                  {!isModelListLoading && availableModels.length === 0 && <option>No models available</option>}
                  {availableModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
                <p className="text-xs text-neutral-500 mt-2">Models are fetched automatically based on your provider and key.</p>
              </div>
            </div>
          </div>
          
          <div className="border-b border-neutral-800 pb-6">
            <h3 className="text-lg font-semibold text-neutral-200 mb-4">Emulator & Speed</h3>
             <div>
              <label htmlFor="backendUrl" className={labelClasses}>Pyboy Server URL</label>
              <input type="text" id="backendUrl" value={settings.backendUrl} onChange={handleChange} placeholder="http://localhost:5000" className={inputClasses}/>
              <p className="text-xs text-neutral-500 mt-2">The address of your local Pyboy backend server.</p>
            </div>
            <div className="mt-4">
              <label htmlFor="aiActionInterval" className={labelClasses}>AI Action Interval (ms)</label>
              <input type="number" id="aiActionInterval" value={settings.aiActionInterval} onChange={handleChange} min="1000" max="30000" step="500" className={inputClasses} />
              <p className="text-xs text-neutral-500 mt-2">Time between each AI move. Lower is faster. (1000-30000ms)</p>
            </div>
          </div>

        </div>

        <div className="flex justify-end p-4 bg-neutral-950/50 border-t border-neutral-800 rounded-b-lg">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-cyan-glow text-neutral-950 font-bold rounded-md hover:bg-opacity-80 transition-all duration-200"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;