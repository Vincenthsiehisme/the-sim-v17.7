
import React from 'react';
import { Clock, Smartphone, Briefcase, Coffee, Moon, Sun, Zap, Home, BookOpen, Monitor } from 'lucide-react';

interface GoldenMoment {
  time: string;
  context: string;
  channel: string;
  icon?: string; // New icon key from backend
}

const IconMap: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  coffee: Coffee,
  moon: Moon,
  sun: Sun,
  zap: Zap,
  home: Home,
  book: BookOpen,
  default: Clock
};

// Helper to determine styling based on icon type
const getStyleForIcon = (iconKey: string = 'default') => {
  switch (iconKey) {
    case 'briefcase':
    case 'book':
      return { 
        bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', 
        badge: 'bg-blue-500 text-white' 
      };
    case 'moon':
    case 'home':
      return { 
        bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', 
        badge: 'bg-slate-500 text-white' 
      };
    case 'zap':
    case 'sun':
      return { 
        bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', 
        badge: 'bg-amber-500 text-white' 
      };
    case 'coffee':
      return { 
        bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', 
        badge: 'bg-emerald-500 text-white' 
      };
    default:
      return { 
        bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', 
        badge: 'bg-indigo-500 text-white' 
      };
  }
};

export const GoldenTimeline: React.FC<{ moments: GoldenMoment[] }> = ({ moments }) => {
  return (
    <div className="relative py-4 pl-4 h-full flex flex-col overflow-hidden">
       {/* Axis Line */}
       <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-slate-200 border-l border-dashed border-slate-300"></div>
       
       {/* Scrollable Container */}
       <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0 custom-scrollbar relative z-10">
          {moments.map((m, i) => {
             const IconComponent = IconMap[m.icon || 'default'] || IconMap.default;
             const style = getStyleForIcon(m.icon);
             const isMobile = m.channel.toLowerCase().includes('mobile');

             return (
               <div key={i} className="relative flex items-center gap-4 group">
                  {/* Time Node Icon */}
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0 z-10 transition-all shadow-sm bg-white ${style.border} ${style.text}`}>
                     <IconComponent className="w-5 h-5 fill-current opacity-80" />
                  </div>
                  
                  {/* Content Card */}
                  <div className={`flex-1 min-w-0 bg-white p-3 rounded-xl border shadow-sm hover:shadow-md transition-all ${style.border}`}>
                     <div className="flex justify-between items-start mb-1.5 gap-2">
                        <span className="text-lg font-black text-slate-800 truncate tracking-tight">{m.time}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${style.badge}`}>
                           {m.context}
                        </span>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 truncate">
                        {isMobile ? <Smartphone className="w-3 h-3 text-slate-400" /> : <Monitor className="w-3 h-3 text-slate-400" />}
                        <span className="font-bold text-slate-700 truncate">{m.channel}</span>
                     </div>
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
};
