
import React, { useMemo } from 'react';
import { ChronosReport, ChronosEvent, TacticalAlert } from '../../../types';
import { CloudRain, Sun, Calendar, TrendingUp, AlertTriangle, MessageCircle, Lightbulb, Zap, Loader2, RefreshCw, Search, CalendarRange, Clock, Radar, Wallet, Eye, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';

// ==========================================
// Sub-components
// ==========================================

const StateIndicator: React.FC<{ 
    label: string, 
    value: string, 
    reason?: string,
    icon: React.ElementType 
}> = ({ label, value, reason, icon: Icon }) => {
    
    // Config: Determine colors based on Value
    let color = "bg-slate-100 text-slate-500 border-slate-200";
    let light = "bg-slate-400";
    
    // Logic for Liquidity
    if (value === 'High' || value === 'Open') {
        color = "bg-emerald-50 text-emerald-700 border-emerald-200";
        light = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    } else if (value === 'Medium' || value === 'Fragmented') {
        color = "bg-amber-50 text-amber-700 border-amber-200";
        light = "bg-amber-500";
    } else if (value === 'Low' || value === 'Occupied') {
        color = "bg-orange-50 text-orange-700 border-orange-200";
        light = "bg-orange-500";
    } else if (value === 'Crisis') {
        color = "bg-rose-50 text-rose-700 border-rose-200";
        light = "bg-rose-600 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]";
    }

    return (
        <div className={`flex flex-col p-4 rounded-xl border ${color} relative overflow-hidden transition-all hover:shadow-sm`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider opacity-80">
                    <Icon className="w-4 h-4" />
                    {label}
                </div>
                {/* Status Light */}
                <div className={`w-3 h-3 rounded-full ${light} border-2 border-white`}></div>
            </div>
            
            {/* Main Value */}
            <div className="text-xl font-black mb-2 tracking-tight">
                {value}
            </div>
            
            {/* Reason Text */}
            {reason && (
                <div className="mt-auto text-[10px] opacity-90 leading-relaxed font-medium">
                    {reason}
                </div>
            )}
        </div>
    );
};

const AlertCard: React.FC<{ alert: TacticalAlert }> = ({ alert }) => {
    let style = {
        border: 'border-slate-200',
        bg: 'bg-slate-50',
        iconColor: 'text-slate-500',
        titleColor: 'text-slate-700',
        icon: Info
    };

    if (alert.level === 'Critical') {
        style = {
            border: 'border-rose-200',
            bg: 'bg-rose-50',
            iconColor: 'text-rose-500',
            titleColor: 'text-rose-800',
            icon: AlertTriangle
        };
    } else if (alert.level === 'Warning') {
        style = {
            border: 'border-amber-200',
            bg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            titleColor: 'text-amber-800',
            icon: AlertCircle
        };
    } else {
        style = {
            border: 'border-indigo-200',
            bg: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            titleColor: 'text-indigo-800',
            icon: Lightbulb
        };
    }

    const Icon = style.icon;

    return (
        <div className={`rounded-xl border ${style.border} ${style.bg} p-4 flex flex-col gap-3 relative overflow-hidden group`}>
            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.level === 'Critical' ? 'bg-rose-500' : alert.level === 'Warning' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
            
            <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${style.iconColor}`} />
                <span className={`text-sm font-bold ${style.titleColor}`}>{alert.title}</span>
                <span className="ml-auto text-[9px] font-black uppercase opacity-60 tracking-wider bg-white/50 px-2 py-0.5 rounded">{alert.type}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                <div>
                    <div className="text-[10px] font-bold opacity-60 uppercase mb-1">診斷 (Diagnosis)</div>
                    <div className="text-xs font-medium text-slate-700 leading-snug">
                        {alert.symptom}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold opacity-60 uppercase mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 處方 (Action)
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug">
                        {alert.prescription}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventItem: React.FC<{ event: ChronosEvent }> = ({ event }) => {
    const getIcon = () => {
        switch(event.type) {
            case 'weather': return event.title.includes('雨') || event.title.includes('颱風') ? CloudRain : Sun;
            case 'holiday': return Calendar;
            case 'trend': return TrendingUp;
            case 'disaster': return AlertTriangle;
            default: return MessageCircle;
        }
    };
    
    const Icon = getIcon();
    
    let color = "text-slate-500 bg-slate-50 border-slate-100";
    if (event.impact_level === 'High') color = "text-rose-600 bg-rose-50 border-rose-100";
    if (event.impact_level === 'Medium') color = "text-indigo-600 bg-indigo-50 border-indigo-100";

    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${color} relative group hover:shadow-sm transition-shadow`}>
            <div className={`p-2 rounded-lg shrink-0 bg-white shadow-sm`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold opacity-70 uppercase tracking-wider">{event.type}</span>
                    <span className="text-[10px] font-bold opacity-50">{event.date}</span>
                </div>
                <div className="font-bold text-sm leading-tight">
                    {event.title}
                </div>
            </div>
        </div>
    );
};

export const ChronosCard: React.FC<{ 
    report?: ChronosReport; 
    isLoading: boolean;
    onGenerate: () => void;
}> = ({ report, isLoading, onGenerate }) => {
    
    // Legacy support: extract marketing tags if structured alerts are missing
    const strategyTags = useMemo(() => {
        if (!report?.marketing_advice) return [];
        const keywords = ["節日", "促銷", "連假", "新品", "優惠", "活動", "週年慶", "雙11", "618", "母親節", "父親節", "情人節", "聖誕節", "跨年", "週末", "寒假", "暑假", "開學", "換季", "旅遊", "送禮", "預購", "限定", "年終", "紅包", "春節"];
        return keywords.filter(k => report.marketing_advice?.includes(k));
    }, [report?.marketing_advice]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-slate-700">正在連線時空戰情室...</h3>
                <p className="text-sm text-slate-400 mt-2">AI 正在計算金流週期與心智頻寬。</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 h-full flex flex-col items-center justify-center text-center group min-h-[400px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Radar className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">尚未啟用戰術雷達</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto mb-6 leading-relaxed">
                    啟用後，系統將結合真實日曆與角色經濟狀況，計算出最佳的「進攻窗口」與「防禦警示」。
                </p>
                <button 
                    onClick={onGenerate}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    <RefreshCw className="w-4 h-4" />
                    立即分析 (Activate Radar)
                </button>
            </div>
        );
    }

    const { mode, timeline, summary, current_state, tactical_alerts, marketing_advice } = report;

    // Visual Config based on Mode
    const safeMode = (mode && ['forensic', 'live', 'forecast'].includes(mode)) ? mode : 'live';
    const modeConfig = {
        'forensic': { color: 'text-amber-600', label: '鑑識模式 (Past)', icon: Search, bg: 'bg-amber-50' },
        'live': { color: 'text-rose-600', label: '戰術雷達 (Live)', icon: Radar, bg: 'bg-rose-50' },
        'forecast': { color: 'text-sky-600', label: '趨勢預測 (Future)', icon: TrendingUp, bg: 'bg-sky-50' }
    }[safeMode];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* Left Column: Dashboard (7) */}
            <div className="lg:col-span-7 flex flex-col gap-6 h-full">
                
                {/* 1. Header & States */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-5">
                        <SectionTitle title="戰情室儀表板" icon={Radar} compact />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{report.analysis_date}</span>
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${modeConfig.bg} ${modeConfig.color}`}>
                                <modeConfig.icon className="w-3.5 h-3.5" />
                                {modeConfig.label}
                            </span>
                        </div>
                    </div>

                    {/* Gauges */}
                    <div className="grid grid-cols-2 gap-4">
                        <StateIndicator 
                            label="購買力 (Liquidity)" 
                            value={current_state?.liquidity || 'Unknown'} 
                            reason={current_state?.liquidity_reason}
                            icon={Wallet} 
                        />
                        <StateIndicator 
                            label="腦容量 (Bandwidth)" 
                            value={current_state?.bandwidth || 'Unknown'} 
                            reason={current_state?.bandwidth_reason}
                            icon={Eye} 
                        />
                    </div>
                </div>

                {/* 2. Tactical Alerts */}
                <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <SectionTitle title="戰術干預警示" icon={AlertTriangle} subtitle="Tactical Interventions" compact />
                    
                    <div className="flex-1 flex flex-col gap-3 mt-2">
                        {tactical_alerts && tactical_alerts.length > 0 ? (
                            tactical_alerts.map((alert, i) => (
                                <AlertCard key={i} alert={alert} />
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic border-2 border-dashed border-slate-100 rounded-xl">
                                目前無重大警示
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Context (5) */}
            <div className="lg:col-span-5 flex flex-col h-full min-h-[300px]">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <SectionTitle title="環境背景脈絡" icon={CalendarRange} />
                    
                    <div className="mb-4 text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {summary}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 max-h-[400px]">
                        {timeline && timeline.length > 0 ? (
                            timeline.map((event, i) => (
                                <EventItem key={i} event={event} />
                            ))
                        ) : (
                            <div className="text-center text-slate-400 py-10 text-xs">無重大事件紀錄</div>
                        )}
                    </div>

                    {/* Footer Tags (Fallback for legacy advice text) */}
                    {strategyTags.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">關鍵字標籤</div>
                            <div className="flex flex-wrap gap-2">
                                {strategyTags.map(t => (
                                    <span key={t} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 cursor-default">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
