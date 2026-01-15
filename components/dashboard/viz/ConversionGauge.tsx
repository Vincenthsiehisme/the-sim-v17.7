
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, User, Zap, Info, Lock } from 'lucide-react';
import { ConversionAnalysis } from '../../../utils/personaAnalytics';

export const ConversionGauge: React.FC<{ 
  analysis: ConversionAnalysis; 
  label: string; 
}> = ({ analysis, label }) => {
  const { totalScore, sentiment, drive, resistance } = analysis;
  const [isHovered, setIsHovered] = useState(false);

  // Configuration based on score
  let color = "#64748b"; // slate
  let textColor = "text-slate-600";
  
  if (totalScore >= 70) {
    color = "#10b981"; // emerald-500
    textColor = "text-emerald-600";
  } else if (totalScore <= 40) {
    color = "#ef4444"; // red-500
    textColor = "text-rose-600";
  } else {
    color = "#f59e0b"; // amber-500
    textColor = "text-amber-600";
  }

  // SVG Calculations for semi-circle
  const radius = 80;
  const stroke = 12;
  const normalizedScore = Math.min(100, Math.max(0, totalScore));
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div 
      className="relative flex flex-col items-center justify-between h-full min-h-[300px] group cursor-default p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="w-full flex justify-start">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
           <Zap className="w-3 h-3" /> {label}
        </span>
      </div>

      {/* Main Gauge */}
      <div className="relative mt-2">
         <svg width="240" height="140" viewBox="0 0 240 140" className="overflow-visible">
            {/* Background Track */}
            <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#f1f5f9" strokeWidth={stroke} strokeLinecap="round" />
            
            {/* Value Path */}
            <path 
              d="M 20 120 A 100 100 0 0 1 220 120" 
              fill="none" 
              stroke={color} 
              strokeWidth={stroke} 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Needle / Indicator Line */}
            <line x1="120" y1="120" x2="120" y2="30" stroke="transparent" strokeWidth="2" transform={`rotate(${(normalizedScore / 100) * 180 - 90} 120 120)`}>
            </line>
         </svg>
         
         {/* Center Score */}
         <div className="absolute inset-x-0 bottom-0 text-center flex flex-col items-center justify-end h-full pb-2">
            <span className={`text-6xl font-black tracking-tighter transition-colors duration-300 ${textColor}`}>
               {totalScore}
            </span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mt-2 ${textColor}`}>
               {sentiment}
            </span>
         </div>
      </div>

      {/* DUAL ENERGY BAR (Psychological Net Value) */}
      <div className="w-full max-w-[90%] mt-6 space-y-4">
          
          {/* Drive Bar */}
          <div>
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                   <TrendingUp className="w-3 h-3" /> {drive.label}
                </span>
                <span className="text-[10px] font-black text-emerald-600">{drive.score}</span>
             </div>
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-emerald-400 rounded-full" 
                   style={{ width: `${drive.score}%` }}
                ></div>
             </div>
          </div>

          {/* Resistance Bar */}
          <div className="relative">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                   {resistance.isRealityLocked ? <Lock className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} 
                   {resistance.label}
                </span>
                <span className="text-[10px] font-black text-rose-500">{resistance.score}</span>
             </div>
             
             {/* Progress Bar with Shadow/Lock Effect */}
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                   className={`h-full rounded-full transition-all duration-500 ${resistance.isRealityLocked ? 'bg-rose-600 striped-bar' : 'bg-rose-400'}`} 
                   style={{ width: `${Math.min(100, resistance.score)}%` }}
                ></div>
                {/* Visual marker for Reality Lock */}
                {resistance.isRealityLocked && (
                   <div className="absolute top-0 bottom-0 left-0 right-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                )}
             </div>
             
             {resistance.isRealityLocked && (
                <div className="mt-1 text-[9px] text-rose-400 font-medium italic text-right">
                   * 現實係數 (Reality) 強制加權
                </div>
             )}
          </div>
      </div>

      <style>{`
        .striped-bar {
          background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
          background-size: 1rem 1rem;
        }
      `}</style>
    </div>
  );
};
