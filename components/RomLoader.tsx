import React, { useState } from 'react';
import UploadIcon from './icons/UploadIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface RomLoaderProps {
    onLoadRom: (file: File) => Promise<void>;
}

const RomLoader: React.FC<RomLoaderProps> = ({ onLoadRom }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setError(null);
        }
    };

    const handleLoadClick = async () => {
        if (!selectedFile) {
            setError("Please select a file first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onLoadRom(selectedFile);
            // Parent will handle success and unmount this component
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during upload.");
            setIsLoading(false);
        }
    };
    
    const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading) {
            setIsDragging(true);
        }
    }
     const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }
    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isLoading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
            setError(null);
            e.dataTransfer.clearData();
        }
    }
    
    if (isLoading) {
        return (
            <div className="relative w-full aspect-[10/9] bg-neutral-900 rounded-lg shadow-2xl shadow-black/50 overflow-hidden border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center p-8 text-center">
                <SpinnerIcon className="w-12 h-12 text-cyan-glow animate-spin" />
                <h3 className="mt-4 text-lg font-bold text-neutral-200">Loading Game...</h3>
                <p className="mt-1 text-sm text-neutral-400">Please wait while the ROM is being processed.</p>
            </div>
        );
    }

    return (
        <div className={`relative w-full aspect-[10/9] bg-neutral-900 rounded-lg shadow-2xl shadow-black/50 overflow-hidden border-2 border-dashed ${error ? 'border-red-500/50' : 'border-neutral-700'} flex flex-col items-center justify-center p-8 text-center transition-colors ${isDragging ? 'bg-neutral-800' : ''}`}>
            <label 
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <UploadIcon className="w-8 h-8 text-neutral-500"/>
                <h3 className="mt-4 text-lg font-bold text-neutral-200">Load Game ROM</h3>
                <p className="mt-1 text-sm text-neutral-400">Drag & drop a file or click to select</p>
                <input type="file" className="hidden" onChange={handleFileChange} accept=".gb, .gbc, .gba" />
                {selectedFile && <p className="mt-4 text-sm font-mono bg-neutral-800 p-2 rounded">{selectedFile.name}</p>}
            </label>
            
            {error && (
                <div className="mt-4 text-sm bg-red-900/50 border border-red-500/50 text-red-400 p-3 rounded-md w-full">
                    {error}
                </div>
            )}
            
            <button
                onClick={handleLoadClick}
                disabled={!selectedFile}
                className="mt-6 px-6 py-2 bg-cyan-glow text-neutral-950 font-bold rounded-md hover:opacity-80 transition-all duration-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed"
            >
                Load ROM
            </button>
        </div>
    );
}

export default RomLoader;
