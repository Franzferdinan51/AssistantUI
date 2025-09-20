import React from 'react';
import type { Achievement } from '../types';

interface AchievementTimelineProps {
  achievements: Achievement[];
}

const AchievementTimeline: React.FC<AchievementTimelineProps> = ({ achievements }) => {
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between">
        {achievements.map((achievement, index) => (
          <React.Fragment key={achievement.name}>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 p-1 bg-neutral-700 rounded-full border-2 border-neutral-600 flex items-center justify-center">
                <img src={achievement.iconUrl} alt={achievement.name} className="w-full h-full object-contain" />
              </div>
              <div className="text-xs text-neutral-400 mt-2">{achievement.time}</div>
            </div>
            {index < achievements.length - 1 && <div className="flex-grow h-0.5 bg-green-500/50 mx-2"></div>}
          </React.Fragment>
        ))}
        {/* Placeholder for future achievements */}
        <div className="flex-grow h-0.5 bg-neutral-700 mx-2"></div>
        <div className="flex flex-col items-center text-center opacity-50">
            <div className="w-10 h-10 p-1 bg-neutral-800 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-neutral-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
             <div className="text-xs text-neutral-500 mt-2">Next Goal</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementTimeline;