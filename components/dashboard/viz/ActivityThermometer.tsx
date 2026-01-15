
import React from 'react';

export const ActivityThermometer: React.FC<{ 
  totalEvents: number; 
  activeDays?: number; 
  dataWindow?: { start_date: string; end_date: string };
}> = ({ totalEvents, activeDays = 1, dataWindow }) => {
  
  // 1. Calculate Total Span (Inclusive Calendar Days)
  // Logic: Reset both dates to midnight 00:00:00. Calculate difference in days. Add 1.
  // Example: Mon 10:00 to Mon 23:00 -> Diff 0 days + 1 = 1 Day Span.
  // Example: Mon 23:00 to Tue 01:00 -> Diff 1 day + 1 = 2 Day Span.
  let spanDays = 1;
  
  if (dataWindow?.start_date && dataWindow?.end_date) {
    const start = new Date(dataWindow.start_date);
    const end = new Date(dataWindow.end_date);
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Normalize to midnight to ignore time-of-day differences
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        spanDays = Math.max(1, diffDays + 1);
    }
  }

  // 2. Calculate Density Ratio (Active / Span)
  const safeActiveDays = Math.min(activeDays || 1, spanDays);
  const densityRatio = safeActiveDays / spanDays;
  const percent = Math.min(100, densityRatio * 100);
  
  // 3. Determine Status Label & Color
  let color = "bg-slate-400";
  let label = "低密度";
  
  if (percent > 50) { 
      color = "bg-rose-500"; 
      label = "密集活躍 (High Density)"; 
  } else if (percent > 15) { 
      color = "bg-indigo-500"; 
      label = "定期回訪 (Regular)"; 
  } else { 
      color = "bg-blue-400"; 
      label = "稀疏頻率 (Sparse)"; 
  }

  return (
    <div className="flex flex-col gap-1 w-full">
       <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-slate-600 whitespace-nowrap">
            {Math.round(percent)}%
        </span>
      </div>
      <div className="flex justify-between items-end">
        <span className="text-[9px] text-slate-400 font-medium">{label}</span>
        <span className="text-[9px] text-slate-500 font-mono">
            活躍 {safeActiveDays}天 / 跨度 {spanDays}天
        </span>
      </div>
    </div>
  );
};
