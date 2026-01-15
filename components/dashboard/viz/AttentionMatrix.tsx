
import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, Label } from 'recharts';
import { CalendarClock, Zap, Heart, Hourglass, Wind } from 'lucide-react';

interface MatrixData {
  x: number; // Duration (Relative Days)
  y: number; // Intensity (Events/Day)
  z: number; // Weight
  label: string;
  type: string; // burst, obsession, habit, glance
  opacity: number; // Recency
  recencyLabel: string; 
  keywords?: string[]; 
  lastSeen?: string; 
}

const COLORS = {
  burst: '#f43f5e', // Rose-500
  obsession: '#8b5cf6', // Violet-500
  habit: '#10b981', // Emerald-500
  glance: '#94a3b8' // Slate-400
};

// Quadrant Strategy Map with Icons
const QUADRANT_CONFIG = {
  burst: {
    label: "爆發 (Hot)",
    action: "趁熱收割",
    color: "bg-rose-500",
    textColor: "text-rose-600",
    subColor: "text-rose-400/80",
    icon: Zap
  },
  obsession: {
    label: "鐵粉 (Fan)",
    action: "深耕關係",
    color: "bg-violet-500",
    textColor: "text-violet-600",
    subColor: "text-violet-400/80",
    icon: Heart
  },
  glance: {
    label: "路過 (Passby)",
    action: "建立鉤子",
    color: "bg-slate-400",
    textColor: "text-slate-500",
    subColor: "text-slate-400/80",
    icon: Wind
  },
  habit: {
    label: "猶豫 (Slow)",
    action: "提供保證",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    subColor: "text-emerald-400/80",
    icon: Hourglass
  }
};

export const AttentionMatrix: React.FC<{ data: MatrixData[] }> = ({ data }) => {
  // 1. Data Processing: Add Jitter & Calculate Active Quadrants
  const { processedData } = useMemo(() => {
    if (!data || data.length === 0) return { processedData: [] };

    const processed = data.map(d => {
        return {
            ...d,
            // Add random jitter to prevent overlap
            // X (Duration): +/- 0.5 days max
            xJitter: Math.max(0.1, d.x + (Math.random() - 0.5) * 0.8),
            // Y (Intensity): +/- 0.15 events max
            yJitter: Math.max(0.1, d.y + (Math.random() - 0.5) * 0.3)
        };
    });

    return { processedData: processed };
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col min-h-[300px] select-none bg-white rounded-xl overflow-hidden">
       
       {/* 0. Legend Header (Icons Here) */}
       <div className="flex gap-4 justify-end px-4 py-2 border-b border-slate-50">
          {(Object.keys(QUADRANT_CONFIG) as Array<keyof typeof QUADRANT_CONFIG>).map((key) => {
             const config = QUADRANT_CONFIG[key];
             const Icon = config.icon;
             return (
               <div key={key} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                  <Icon className={`w-3 h-3 ${config.textColor}`} />
                  <span className={`text-[10px] font-bold text-slate-500`}>
                     {config.label.split(' ')[0]}
                  </span>
               </div>
             );
          })}
       </div>

       <div className="relative flex-1 w-full h-full">
          {/* 1. Quadrant Background (CSS Grid) */}
          <div className="absolute inset-[30px_20px_40px_50px] grid grid-cols-2 grid-rows-2 gap-1 z-0">
              <div className="bg-rose-50/20 rounded-tl-xl border-l border-t border-dashed border-rose-100/30"></div> {/* Top-Left: Burst */}
              <div className="bg-violet-50/20 rounded-tr-xl border-r border-t border-dashed border-violet-100/30"></div> {/* Top-Right: Core */}
              <div className="bg-slate-50/20 rounded-bl-xl border-l border-b border-dashed border-slate-100/30"></div> {/* Bottom-Left: Glance */}
              <div className="bg-emerald-50/20 rounded-br-xl border-r border-b border-dashed border-emerald-100/30"></div> {/* Bottom-Right: Habit */}
          </div>

          {/* 2. Chart Layer */}
          <div className="absolute inset-0 z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis 
                    type="number" 
                    dataKey="xJitter" 
                    name="猶豫週期" 
                    unit="天" 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickCount={5}
                    allowDataOverflow={false}
                  >
                    <Label value="猶豫週期 (Duration)" offset={0} position="insideBottom" style={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 'bold' }} />
                  </XAxis>
                  
                  <YAxis 
                    type="number" 
                    dataKey="yJitter" 
                    name="關注熱度" 
                    unit="次" 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickCount={5}
                    allowDataOverflow={false}
                  >
                    <Label value="關注熱度 (Frequency)" angle={-90} position="insideLeft" style={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 'bold' }} />
                  </YAxis>
                  
                  <ZAxis type="number" dataKey="z" range={[80, 450]} name="權重" />
                  
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload; // Access raw data
                        const color = COLORS[d.type as keyof typeof COLORS] || COLORS.glance;
                        const keywords = d.keywords || [];
                        const hasKeywords = keywords.length > 0;
                        const config = QUADRANT_CONFIG[d.type as keyof typeof QUADRANT_CONFIG] || QUADRANT_CONFIG.glance;
                        const Icon = config.icon;

                        return (
                          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-slate-100 z-50 min-w-[200px] animate-fade-in-up">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-100">
                              <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: color }}></div>
                              <span className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{d.label}</span>
                            </div>
                            
                            <div className="space-y-2">
                                {/* Type Badge */}
                                <div className="flex justify-between items-center">
                                  <div className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded text-white`} style={{ backgroundColor: color }}>
                                      <Icon className="w-3 h-3" />
                                      {config.label.split(' ')[0]}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                      {d.recencyLabel}
                                  </span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded-lg">
                                  <div className="flex flex-col">
                                      <span className="text-slate-400 uppercase font-bold text-[8px]">Duration</span>
                                      <span className="font-bold text-slate-600">{d.x.toFixed(1)} 天</span>
                                  </div>
                                  <div className="flex flex-col border-l border-slate-200 pl-2">
                                      <span className="text-slate-400 uppercase font-bold text-[8px]">Freq</span>
                                      <span className="font-bold text-slate-600">{d.y.toFixed(1)} 次/天</span>
                                  </div>
                                </div>

                                {/* Keywords Section */}
                                {hasKeywords && (
                                  <div className="flex flex-wrap gap-1">
                                      {keywords.map((kw: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold border border-indigo-100">
                                            #{kw}
                                        </span>
                                      ))}
                                  </div>
                                )}

                                {/* Footer */}
                                {d.lastSeen && d.lastSeen !== "N/A" && (
                                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 justify-end pt-1">
                                      <CalendarClock className="w-3 h-3" />
                                      最近互動: {d.lastSeen}
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Scatter name="Interests" data={processedData}>
                    {processedData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.type as keyof typeof COLORS] || COLORS.glance} 
                        fillOpacity={entry.opacity || 0.8} // Dynamic Opacity
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="transition-all duration-300 hover:opacity-100 cursor-pointer filter drop-shadow-sm hover:drop-shadow-md"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
};
