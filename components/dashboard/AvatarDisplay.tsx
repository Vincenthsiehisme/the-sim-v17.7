import React from 'react';
import { Loader2, AlertTriangle, UserCircle } from 'lucide-react';

export const AvatarDisplay: React.FC<{ 
  avatarUrl?: string; 
  isLoading: boolean; 
  error: string | null; 
  simple?: boolean; // New prop for small containers (chat bubbles, headers)
}> = ({ avatarUrl, isLoading, error, simple = false }) => {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />;
  }
  
  if (isLoading) {
    if (simple) {
       return <Loader2 className="w-full h-full p-1.5 animate-spin text-indigo-400" />;
    }
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <span className="text-[10px] font-bold text-indigo-400">生成中</span>
      </div>
    );
  }
  
  if (error) {
    if (simple) {
        return (
          <div title={error || 'Error'} className="w-full h-full">
            <AlertTriangle className="w-full h-full p-1.5 text-amber-300" />
          </div>
        );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center h-full px-2">
        <AlertTriangle className="w-6 h-6 text-amber-300 mb-1" />
        <span className="text-[9px] font-bold text-amber-400">{error}</span>
      </div>
    );
  }
  
  return <UserCircle className="w-full h-full text-slate-300 p-0.5" />;
};
