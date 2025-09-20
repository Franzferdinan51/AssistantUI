import React from 'react';
import type { PartyMember } from '../types';

const PRESET_COLORS = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500 text-black', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
];

const getTypeColor = (type: string) => {
    let hash = 0;
    if (type.length === 0) return 'bg-gray-600';
    for (let i = 0; i < type.length; i++) {
        const char = type.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash % PRESET_COLORS.length);
    return PRESET_COLORS[index];
}

const PartyMemberCard: React.FC<{ member: PartyMember }> = ({ member }) => {
    const hpPercentage = (member.hp.current / member.hp.max) * 100;
    
    return (
        <div className="bg-neutral-900 border border-border-color rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                    <img src={member.spriteUrl} alt={member.name} className="w-12 h-12" style={{imageRendering: 'pixelated'}}/>
                    <div>
                        <p className="font-mono text-sm font-bold">{member.name}</p>
                        <div className="flex space-x-1 mt-1">
                            {member.types.map(type => (
                                <span key={type} className={`px-2 py-0.5 text-xs font-bold rounded ${getTypeColor(type)}`}>
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="font-mono text-xl font-bold">{member.level}</div>
            </div>
            <div className="mt-2 text-right">
                <p className="font-mono text-xs text-neutral-400">{member.hp.current}/{member.hp.max}</p>
                <div className="w-full bg-neutral-700 rounded-full h-2.5 mt-1">
                    <div className="bg-brand-green h-2.5 rounded-full" style={{width: `${hpPercentage}%`}}></div>
                </div>
            </div>
        </div>
    );
}

const PartyDisplay: React.FC<{ party: PartyMember[] }> = ({ party }) => {
  return (
    <div className="w-full grid grid-cols-2 gap-4">
      {party.map(p => <PartyMemberCard key={p.name} member={p} />)}
    </div>
  );
};

export default PartyDisplay;