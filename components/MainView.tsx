import React, { useState } from 'react';
import { Download, ImageIcon, Loader2, Maximize2, X, Aperture, Cpu, Layers, Sparkles } from 'lucide-react';
import { GeneratedImage } from '../types';

interface MainViewProps {
  currentImage: GeneratedImage | null;
  isGenerating: boolean;
  onSelectHistory: (img: GeneratedImage) => void;
}

export const MainView: React.FC<MainViewProps> = ({ 
  currentImage, 
  isGenerating,
  onSelectHistory
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative z-0">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-hidden">
        
        {isGenerating ? (
            // --- SKELETON LOADER ---
            <div className="relative w-full max-w-2xl aspect-square flex flex-col items-center justify-center p-8">
                {/* Glowing Border Box */}
                <div className="absolute inset-0 border border-white/5 rounded-2xl bg-slate-900/50 backdrop-blur-sm shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[shimmer_2s_infinite]" />
                </div>

                {/* Center Animation */}
                <div className="z-10 flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin shadow-[0_0_30px_rgba(59,130,246,0.2)]"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-400 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-light text-white tracking-tight animate-pulse">AI 正在构思中...</h3>
                        <p className="text-sm text-slate-500 font-mono">正在计算张量 / 处理工作流节点</p>
                    </div>
                </div>
            </div>
        ) : currentImage ? (
          // --- IMAGE DISPLAY ---
          <div 
            className="relative group flex items-center justify-center w-full h-full animate-in fade-in zoom-in-95 duration-500 ease-out"
            onMouseEnter={() => setShowMetadata(true)}
            onMouseLeave={() => setShowMetadata(false)}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            
            <img 
              src={currentImage.url} 
              alt="生成结果" 
              onClick={() => setIsZoomed(true)}
              className="relative max-w-full max-h-full rounded-lg shadow-2xl border border-white/10 object-contain cursor-zoom-in transition-transform duration-300 z-10"
            />
            
            {/* Metadata Overlay (Left Side) */}
            {currentImage.metadata && (
                <div className={`absolute top-4 left-4 max-w-xs transition-all duration-300 z-20 ${showMetadata ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                     <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-4 text-xs shadow-xl space-y-3">
                        <h4 className="font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                            <Layers className="w-3 h-3 text-blue-400" /> 参数信息
                        </h4>
                        
                        {/* Models */}
                        {currentImage.metadata.models.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-slate-500 uppercase tracking-wider text-[10px]">模型</span>
                                {currentImage.metadata.models.map((m, i) => (
                                    <div key={i} className="text-slate-200 truncate flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${m.type === 'checkpoint' ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                                        {m.name}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Numeric Fields */}
                        <div className="grid grid-cols-2 gap-2">
                            {currentImage.metadata.fields.filter(f => f.type === 'number').map(f => (
                                <div key={f.field} className="bg-white/5 rounded p-1.5">
                                    <span className="block text-[9px] text-slate-500 uppercase">{f.label.split('(')[0]}</span>
                                    <span className="font-mono text-slate-200">{f.value}</span>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            )}

            {/* Action Buttons (Bottom) */}
            <div className="absolute bottom-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20">
               <button
                 onClick={() => setIsZoomed(true)}
                 className="flex items-center gap-2 bg-black/60 text-white px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-black/80 hover:scale-105 transition-all shadow-lg font-medium text-sm"
               >
                 <Maximize2 className="w-4 h-4" /> 全屏
               </button>
               <a 
                 href={currentImage.url} 
                 download={`comfy-gen-${Date.now()}.png`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20 hover:bg-slate-200 hover:scale-105 transition-all shadow-lg font-bold text-sm"
               >
                 <Download className="w-4 h-4" /> 下载
               </a>
            </div>
          </div>
        ) : (
          // --- EMPTY STATE ---
          <div className="flex flex-col items-center justify-center text-slate-500 animate-in fade-in duration-700">
             <div className="w-24 h-24 rounded-3xl bg-slate-800/30 border border-white/5 flex items-center justify-center mb-8 shadow-2xl rotate-6 group hover:rotate-0 transition-all duration-500 hover:bg-slate-800/50">
               <Aperture className="w-10 h-10 text-slate-600 group-hover:text-blue-500 transition-colors duration-500" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">ComfyUI 控制台</h2>
             <p className="text-slate-400 text-lg font-light leading-relaxed text-center max-w-md">
               准备就绪。上传工作流，配置参数，<br/>让 AI 将您的想象变为现实。
             </p>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomed && currentImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300" onClick={() => setIsZoomed(false)}>
            <button 
                onClick={() => setIsZoomed(false)}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md group"
            >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
            <img 
                src={currentImage.url} 
                alt="放大的结果" 
                className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}
    </div>
  );
};