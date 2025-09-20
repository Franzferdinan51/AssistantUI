import React from 'react';

interface EmulatorScreenProps {
  imageUrl: string | null;
}

const EmulatorScreen: React.FC<EmulatorScreenProps> = ({ imageUrl }) => {
  // GB screen is 160x144, which is 10:9.
  const aspectRatio = 'aspect-[10/9]';
  const placeholderImageUrl = 'https://i.imgur.com/8Q5QjW1.png';
  
  return (
    <div className={`relative w-full ${aspectRatio} bg-black rounded-lg shadow-2xl shadow-black/50 overflow-hidden border-2 border-neutral-800`}>
      <img 
        src={imageUrl || placeholderImageUrl} 
        alt="Game Screen" 
        className="w-full h-full object-cover" 
        style={{ imageRendering: 'pixelated' }} 
      />
      {!imageUrl && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="text-neutral-400 font-mono">Connecting to emulator...</p>
        </div>
      )}
    </div>
  );
};

export default EmulatorScreen;
