
import React from 'react';

export const ConstraintCard: React.FC<{ 
  label: string; 
  icon: React.ElementType; 
  iconColor: string; 
  children: React.ReactNode; 
  isWarning?: boolean;
}> = ({ label, icon: Icon, iconColor, children, isWarning = false }) => {
  const bgClass = isWarning 
    ? "bg-orange-50/50 border-orange-100 hover:border-orange-200" 
    : "bg-slate-50 border-slate-100 hover:border-indigo-200";
  
  const labelColor = isWarning ? "text-orange-800" : "text-slate-500";

  return (
    <div className={`p-4 rounded-xl border transition-colors h-full flex flex-col justify-center ${bgClass}`}>
       <div className={`flex items-center gap-2 mb-3 font-bold text-xs uppercase ${labelColor}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {label}
       </div>
       <div className="flex-1 flex flex-col justify-center">
          {children}
       </div>
    </div>
  );
};
