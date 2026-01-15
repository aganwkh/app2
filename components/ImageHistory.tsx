import React from 'react';
import { Clock, Image as ImageIcon, Settings2, Trash2 } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageHistoryProps {
  history: GeneratedImage[];
  currentImage: GeneratedImage | null;
  onSelect: (img: GeneratedImage) => void;
  onClear?: () => void;
}

export const ImageHistory: React.FC<ImageHistoryProps> = ({
  history,
  currentImage,
  onSelect,
  onClear
}) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full bg-slate-900/90 border-t border-white/5 backdrop-blur-xl z-30 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-950/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <ImageIcon className="w-3.5 h-3.5" />
          历史记录 ({history.length})
        </div>
        {onClear && (
            <button 
                onClick={onClear} 
                className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-white/5 rounded"
            >
                <Trash2 className="w-3 h-3" /> 清空
            </button>
        )}
      </div>

      <div className="h-32 flex gap-3 p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {history.slice().reverse().map((img, idx) => {
          // Extract key metadata for tooltip/preview
          const seed = img.metadata?.fields.find(f => f.label.includes('Seed'))?.value;
          const steps = img.metadata?.fields.find(f => f.label.includes('Steps'))?.value;

          return (
            <button
              key={`${img.filename}-${idx}`}
              onClick={() => onSelect(img)}
              className={`group relative w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300 flex flex-col bg-slate-800 ${
                currentImage === img 
                  ? 'border-blue-500 ring-4 ring-blue-500/10 scale-105 z-10 shadow-lg shadow-black/50' 
                  : 'border-transparent hover:border-white/20 opacity-70 hover:opacity-100 hover:scale-105'
              }`}
            >
              <div className="flex-1 w-full relative overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
              </div>
              
              {/* Mini Info Bar */}
              {(seed !== undefined || steps !== undefined) && (
                  <div className="h-6 bg-slate-950/90 flex items-center justify-between px-1.5 text-[9px] text-slate-400 font-mono border-t border-white/5">
                      {steps && <span>{steps}s</span>}
                      {seed && <span className="truncate max-w-[40px] opacity-70">#{String(seed).slice(-4)}</span>}
                  </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
};