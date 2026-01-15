
import React, { useState } from 'react';
import { MoveRight, Zap, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { PersonalityDimension } from '../../../types';
import { parseEvidence } from '../../../utils/personaAnalytics';

// Updated TugOfWar with Symbolic Flag Strategy & Optimized Transitions
export const TugOfWar: React.FC<{ 
  left: string; 
  right: string; 
  dimension: PersonalityDimension 
}> = ({ left, right, dimension }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileActive, setIsMobileActive] = useState(false);

  // Combine interactions: either mouse hover (desktop) or tap toggle (mobile)
  const isActive = isHovered || isMobileActive;

  // Parse Scores (0-100)
  const baseScore = dimension.base_score || 50;
  const shift = dimension.contextual_shift;
  const shiftScore = shift?.shift_score !== undefined ? shift.shift_score : baseScore;
  
  // Percent Calculation
  const basePercent = Math.min(100, Math.max(0, baseScore));
  const shiftPercent = Math.min(100, Math.max(0, shiftScore));
  
  // Determine winning side for Text Highlighting
  const currentDisplayScore = isActive ? shiftScore : baseScore;
  const isLeftWinning = currentDisplayScore < 40;
  const isRightWinning = currentDisplayScore > 60;
  
  const { reasoning, reference } = parseEvidence(dimension.evidence || "");

  // Distance for connector line
  const connectorLeft = Math.min(basePercent, shiftPercent);
  const connectorWidth = Math.abs(shiftPercent - basePercent);

  const handleMobileToggle = () => {
    setIsMobileActive(!isMobileActive);
  };

  return (
    <div 
      className="mb-8 last:mb-2 group relative select-none" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMobileToggle}
    >
      <div className="flex justify-between text-xs mb-3 items-end relative z-10">
        <span className={`transition-all duration-300 ${isLeftWinning ? 'text-indigo-700 font-black text-sm scale-105' : 'text-slate-400 font-semibold'}`}>
          {left}
        </span>
        
        {/* Symbolic Flag (Replaces Text Label) - Pure visual indicator */}
        {shift && (
           <div 
             className={`absolute -top-3 w-6 h-6 z-20 transition-all duration-300 ease-out ${
                isActive
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-50 translate-y-2 pointer-events-none'
             }`}
             style={{ 
               left: `${shiftPercent}%`, 
               transform: 'translateX(-50%) translateY(-100%)' 
             }}
           >
              {/* Pulse Effect */}
              <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-40"></div>
              {/* Icon Body */}
              <div className="relative w-full h-full bg-rose-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white">
                 <Zap className="w-3 h-3 fill-current" />
              </div>
           </div>
        )}

        <span className={`transition-all duration-300 ${isRightWinning ? 'text-indigo-700 font-black text-sm scale-105' : 'text-slate-400 font-semibold'}`}>
          {right}
        </span>
      </div>
      
      {/* Track Container */}
      <div className="relative h-3 bg-slate-100 rounded-full shadow-inner mb-2 cursor-pointer overflow-visible group/track">
        {/* Midpoint Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-0"></div>
        
        {/* === LAYER 1: GHOST BASE (Always Visible) === */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-300 bg-white z-10 transition-opacity duration-300"
          style={{ left: `calc(${basePercent}% - 6px)` }}
        ></div>

        {/* === LAYER 2: CONNECTOR LINE (Visible on Active) === */}
        {shift && (
          <div 
            className={`absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-slate-300 via-rose-300 to-rose-400 z-0 transition-all duration-300 ease-out rounded-full ${
               isActive ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              left: `${connectorLeft}%`, 
              width: `${connectorWidth}%` 
            }}
          ></div>
        )}

        {/* === LAYER 3: MAIN HANDLE (Moves) === */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)"
          style={{ left: `${isActive ? shiftPercent : basePercent}%` }}
        >
          {/* Knob */}
          <div className={`w-4 h-4 rounded-full border-2 shadow-md transition-colors duration-300 flex items-center justify-center ${
            shift && isActive 
              ? 'bg-rose-500 border-white ring-2 ring-rose-200' 
              : 'bg-indigo-600 border-white ring-2 ring-indigo-100 group-hover/track:scale-110'
          }`}>
             {shift && isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
          </div>
          
          {/* Triangle Indicator Below */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] transition-colors duration-300 ${
            shift && isActive ? 'border-b-rose-500' : 'border-b-indigo-600'
          }`}></div>
        </div>
      </div>
      
      {/* === RICH POPOVER TOOLTIP (Click/Hover) === */}
      <div 
        className={`absolute z-50 left-0 right-0 top-full mt-3 transition-all duration-300 origin-top ${
           isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ transitionDelay: isActive ? '50ms' : '0ms' }}
      >
          <div className={`rounded-xl shadow-xl border overflow-hidden ${
             shift && isActive 
               ? 'bg-white border-rose-100 ring-1 ring-rose-50' 
               : 'bg-white border-slate-100 ring-1 ring-slate-50'
          }`}>
             {/* Header */}
             <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex justify-between items-center ${
                shift && isActive ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'
             }`}>
                {shift && isActive ? (
                   <div className="flex items-center gap-2 w-full">
                      {/* Context Information Moved Here */}
                      <span className="flex items-center gap-1 text-rose-600 font-bold truncate">
                         <Zap className="w-3 h-3 fill-current" />
                         {shift.condition}
                      </span>
                      <div className="flex-1 h-px bg-rose-200/50"></div>
                      <span className="opacity-50 font-medium">{baseScore}</span>
                      <ArrowRight className="w-3 h-3 text-rose-300" />
                      <span className="font-bold">{shiftScore}</span>
                   </div>
                ) : (
                   <span>性格推論 (Reasoning)</span>
                )}
             </div>

             {/* Content */}
             <div className="p-3 text-xs text-slate-600 leading-relaxed">
                {shift && isActive ? (
                   <p className="text-rose-900/80 font-medium">
                      {shift.description}
                   </p>
                ) : (
                   <p>{reasoning}</p>
                )}
             </div>

             {/* Footer */}
             {reference && !isActive && (
                <div className="px-3 py-1.5 bg-slate-50/50 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
                   <FileText className="w-3 h-3 shrink-0" />
                   <span className="font-mono truncate">{reference}</span>
                </div>
             )}
          </div>
      </div>
    </div>
  );
};
