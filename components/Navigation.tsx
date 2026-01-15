import React from 'react';
import { SlidersHorizontal, Zap, History } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabType = 'parameters' | 'generate' | 'history';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isGenerating: boolean;
  queueSize: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, isGenerating, queueSize }) => {
  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'parameters', label: '配置', icon: SlidersHorizontal },
    { id: 'generate', label: '生成', icon: Zap },
    { id: 'history', label: '历史', icon: History },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 ${
                isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute -top-[1px] w-12 h-1 bg-blue-500 rounded-b-full shadow-[0_2px_15px_rgba(59,130,246,0.6)]"
                />
              )}
              
              <div className="relative">
                  <tab.icon className={`w-6 h-6 ${isActive ? 'fill-blue-500/20 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                  {tab.id === 'generate' && isGenerating && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                  )}
                  {tab.id === 'generate' && !isGenerating && queueSize > 0 && (
                      <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900 shadow-sm">
                          {queueSize}
                      </span>
                  )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-blue-400' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};