
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceArea
} from 'recharts';
import { Smartphone, Monitor, Clock, Zap, Briefcase, Coffee, Moon, Sun, Home, BookOpen, Brain } from 'lucide-react';

interface Moment {
  time: string;
  context: string;
  channel: string;
  icon?: string; 
  mindsetLabel?: string; // NEW
}

// Helper: Parse vague time strings into rough hour integer (0-23)
const parseHour = (timeStr: string): number => {
  const t = timeStr.toLowerCase();
  
  // 1. Try HH:MM parsing
  const match = t.match(/(\d{1,2}):/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // 2. Keyword fallback (Center points of ranges)
  if (t.includes('morning') || t.includes('晨') || t.includes('早')) return 8;
  if (t.includes('noon') || t.includes('lunch') || t.includes('午')) return 12;
  if (t.includes('afternoon') || t.includes('work') || t.includes('工作')) return 15;
  if (t.includes('evening') || t.includes('dinner') || t.includes('晚')) return 19;
  if (t.includes('night') || t.includes('sleep') || t.includes('深夜') || t.includes('睡')) return 23;
  
  return 12; // Default mid-day
};

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

const generateWaveformData = (moments: Moment[]) => {
  // Initialize 24h baseline (Low activity, not zero to look organic)
  const data = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}:00`,
    score: 15, // Baseline probability
    context: '',
    channel: '',
    iconKey: '',
    mindset: '', // NEW
    isPeak: false,
    isShoulder: false
  }));

  // Apply Gaussian Boost for each moment
  moments.forEach(m => {
    const centerHour = parseHour(m.time);
    
    // Spread logic: Center = 100%, +/-1h = 70%, +/-2h = 40%
    const spread = [
      { offset: 0, boost: 85 },
      { offset: -1, boost: 50 },
      { offset: 1, boost: 50 },
      { offset: -2, boost: 20 },
      { offset: 2, boost: 20 },
    ];

    spread.forEach(({ offset, boost }) => {
      const targetH = centerHour + offset;
      // Handle wrap-around for late night? Simple clamp for now.
      if (targetH >= 0 && targetH < 24) {
        // Accumulate score, max at 100
        data[targetH].score = Math.min(100, data[targetH].score + boost);
        
        // Inject Context: 
        // 1. Peak (offset 0): Always overwrite
        // 2. Shoulder (offset +/- 1): Only if empty, propagate from peak
        if (offset === 0) {
           data[targetH].context = m.context;
           data[targetH].channel = m.channel;
           data[targetH].iconKey = m.icon || 'default';
           data[targetH].mindset = m.mindsetLabel || '';
           data[targetH].isPeak = true;
        } else if (Math.abs(offset) === 1 && !data[targetH].context) {
           data[targetH].context = m.context; // Propagate context
           data[targetH].channel = m.channel;
           data[targetH].iconKey = m.icon || 'default';
           data[targetH].mindset = m.mindsetLabel || '';
           data[targetH].isShoulder = true;
        }
      }
    });
  });

  return data;
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const isHigh = d.score > 60;
    
    // Resolve Icon
    const IconComponent = IconMap[d.iconKey] || IconMap.default;
    
    return (
      <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[180px] relative overflow-hidden">
        {/* Glow effect for high activity */}
        {isHigh && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
        
        <div className="flex justify-between items-center mb-2 pl-2 border-b border-slate-700/50 pb-2">
           <span className="font-mono text-slate-300 font-bold text-sm">{d.label}</span>
           <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isHigh ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {d.score}% 活躍
           </span>
        </div>

        {d.context ? (
           <div className="pl-2 space-y-2.5">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                 <div className="p-1 rounded bg-slate-700 text-amber-400 shadow-sm border border-slate-600">
                    <IconComponent className="w-3.5 h-3.5 fill-current" />
                 </div>
                 {d.context}
              </div>
              
              {/* Mindset Tag (New) */}
              {d.mindset && (
                  <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold bg-sky-900/30 p-1.5 rounded border border-sky-800/50">
                     <Brain className="w-3.5 h-3.5" />
                     {d.mindset}
                  </div>
              )}

              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] bg-slate-700/30 p-1 rounded w-fit">
                 {d.channel.toLowerCase().includes('mobile') ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                 {d.channel || "多渠道"}
              </div>
           </div>
        ) : (
           <div className="pl-2 text-slate-500 italic flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              非主要活躍時段
           </div>
        )}
      </div>
    );
  }
  return null;
};

export const DaypartingBar: React.FC<{ moments: Moment[] }> = ({ moments }) => {
  const data = useMemo(() => generateWaveformData(moments), [moments]);

  return (
    <div className="w-full h-full flex flex-col min-h-[220px]">
       
       {/* Chart Container */}
       <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                   </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis 
                   dataKey="hour" 
                   tickFormatter={(h) => `${h}`} 
                   ticks={[0, 6, 12, 18, 23]}
                   stroke="#cbd5e1"
                   tick={{ fontSize: 10, fill: '#94a3b8' }}
                   tickLine={false}
                   axisLine={false}
                />
                
                <YAxis hide domain={[0, 110]} />
                
                <Tooltip content={<CustomTooltip />} />

                {/* Night/Day Reference Areas (Subtle Background) */}
                <ReferenceArea x1={0} x2={6} fill="#f8fafc" fillOpacity={0.5} />
                <ReferenceArea x1={22} x2={23} fill="#f8fafc" fillOpacity={0.5} />

                <Area 
                   type="monotone" 
                   dataKey="score" 
                   stroke="#6366f1" 
                   strokeWidth={3}
                   fill="url(#activityGradient)" 
                   animationDuration={1500}
                />
             </AreaChart>
          </ResponsiveContainer>

          {/* Strategy Overlay Labels */}
          <div className="absolute top-2 right-4 flex gap-3 pointer-events-none">
             <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] font-bold text-slate-600">活躍波峰</span>
             </div>
             <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <span className="text-[10px] font-bold text-slate-400">潛伏期</span>
             </div>
          </div>
       </div>

       {/* Footer Strategy Note - Updated to Mindset Focus */}
       <div className="mt-2 pt-3 border-t border-slate-100 flex items-start gap-2 px-2">
          <Brain className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
             <span className="font-bold text-indigo-600">認知頻寬：</span> 
             波形不僅代表活躍度，更反映使用者的心智狀態（Mindset）。請依據 Tooltip 中的 <span className="font-bold bg-sky-50 text-sky-600 px-1 rounded">狀態標籤</span> 決定溝通策略（如：掃描期給標題、沈浸期給故事）。
          </p>
       </div>
    </div>
  );
};
