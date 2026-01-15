
import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Activity, Clock, ShoppingBag, MousePointer2, FileText } from 'lucide-react';
import { DataHealthReport } from '../../utils/simpleScanner';

export const DataHealthIndicator: React.FC<{ report: DataHealthReport }> = ({ report }) => {
  const { score, genes, rowCount, suggestion } = report;

  const getScoreConfig = (s: number) => {
    if (s >= 80) return { 
        style: "text-emerald-600 bg-emerald-50 border-emerald-200", 
        icon: CheckCircle2 
    };
    if (s >= 50) return { 
        style: "text-amber-600 bg-amber-50 border-amber-200", 
        icon: Activity 
    };
    return { 
        style: "text-rose-600 bg-rose-50 border-rose-200", 
        icon: AlertTriangle 
    };
  };

  const statusConfig = getScoreConfig(score);
  const StatusIcon = statusConfig.icon;

  const GeneItem: React.FC<{ 
    label: string; 
    detected: boolean; 
    icon: React.ElementType; 
    colName?: string;
    impact: string;
  }> = ({ label, detected, icon: Icon, colName, impact }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${detected ? 'bg-slate-50 border-slate-100' : 'bg-white border-dashed border-slate-300 opacity-70'}`}>
       <div className={`p-2 rounded-lg shrink-0 ${detected ? 'bg-white shadow-sm text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          <Icon className="w-4 h-4" />
       </div>
       <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
             <span className={`text-sm font-bold ${detected ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
             {detected ? (
               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
             ) : (
               <div className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">Missing</div>
             )}
          </div>
          {detected ? (
             <div className="text-xs text-slate-500 truncate font-mono">
                偵測欄位: <span className="text-indigo-600 font-bold">{colName}</span>
             </div>
          ) : (
             <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                <span>影響: {impact}</span>
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header Summary */}
      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${statusConfig.style}`}>
         <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-current shrink-0">
            <StatusIcon className="w-8 h-8" />
         </div>
         <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <Activity className="w-4 h-4" />
               <span className="font-bold">資料體檢報告</span>
            </div>
            <p className="text-sm font-medium opacity-90 leading-tight">
               {suggestion}
            </p>
         </div>
         <div className="hidden md:block text-right">
            <div className="text-xs font-bold opacity-70 uppercase tracking-wider">Rows Detected</div>
            <div className="text-lg font-black">{rowCount.toLocaleString()}</div>
         </div>
      </div>

      {/* Gene Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
         <GeneItem 
           label="時間基因" 
           detected={genes.time.detected} 
           colName={genes.time.colName} 
           icon={Clock}
           impact="無法分析活躍作息"
         />
         <GeneItem 
           label="行為基因" 
           detected={genes.action.detected} 
           colName={genes.action.colName} 
           icon={MousePointer2}
           impact="無法區分瀏覽意圖"
         />
         <GeneItem 
           label="情境基因" 
           detected={genes.context.detected} 
           colName={genes.context.colName} 
           icon={ShoppingBag}
           impact="無法評估消費潛力"
         />
      </div>

      {/* Raw Preview (Diagnostic Look) */}
      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-700 shadow-inner">
         <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700 text-slate-500">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
               <FileText className="w-3 h-3" /> Raw Data Preview (Top 5 lines)
            </span>
            <span>UTF-8</span>
         </div>
         <table className="w-full text-left border-collapse opacity-80">
            <tbody>
              {report.previewRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800 transition-colors">
                   <td className="pr-4 py-1 text-slate-500 w-8 select-none">{i + 1}</td>
                   {row.map((cell, j) => (
                      <td key={j} className="pr-4 py-1 whitespace-nowrap text-slate-300">
                         {cell.length > 20 ? cell.substring(0, 20) + '...' : cell}
                      </td>
                   ))}
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};
