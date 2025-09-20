import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { Achievement, PlayerStats } from '../types';

interface DataVisualizationPanelProps {
    achievements: Achievement[];
    stats: PlayerStats;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {  
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-950/80 backdrop-blur-sm border border-border-color p-2 rounded-md shadow-lg">
        <p className="font-mono text-sm text-neutral-300">{`${label} : ${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }

  return null;
};


const DataVisualizationPanel: React.FC<DataVisualizationPanelProps> = ({ achievements, stats }) => {
    const statsData = [
        { name: 'Steps', value: stats.steps },
        { name: 'Money', value: stats.money },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 h-40">
            <div className="flex flex-col items-center justify-center text-center p-2 bg-neutral-950/50 rounded-lg">
                <h4 className="font-mono text-xs text-neutral-400 mb-2">ACHIEVEMENTS</h4>
                <div className="font-mono text-5xl font-bold text-cyan-glow">{achievements.length}</div>
                <div className="text-sm text-neutral-500 mt-1">Completed</div>
            </div>
            <div className="flex flex-col items-center justify-center">
                 <h4 className="font-mono text-xs text-neutral-400 mb-2">PLAYER STATS</h4>
                 <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={statsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                             <XAxis type="number" hide />
                             <YAxis 
                                type="category" 
                                dataKey="name" 
                                stroke="#a3a3a3" 
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                             <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                            <Bar dataKey="value" fill="#33ccff" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    );
};

export default DataVisualizationPanel;