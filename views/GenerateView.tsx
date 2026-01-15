import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { Download, Maximize2, X, Aperture, Play, Square, Loader2, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerateViewProps {
  currentImage: GeneratedImage | null;
  isGenerating: boolean;
  progress: number;
  queueSize: number;
  onGenerate: () => void;
  onInterrupt: () => void;
  isConnected: boolean;
  hasWorkflow: boolean;
}

export const GenerateView: React.FC<GenerateViewProps> = ({
  currentImage,
  isGenerating,
  progress,
  queueSize,
  onGenerate,
  onInterrupt,
  isConnected,
  hasWorkflow
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Floating Action Button Animation
  const fabVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    tap: { scale: 0.9 },
  };

  return (
    // Fixed: min-h-full guarantees background stretch. pb-32 handles the content spacing.
    // The background color/gradient is applied here to ensure it covers the safe area.
    <div className="relative w-full min-h-full flex flex-col bg-slate-950">
        
        {/* Background Ambience - Fixed to fill screen */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-blue-900/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-950 to-transparent"></div>
        </div>

        {/* Content Area - Fixed Padding for Mobile to clear Nav */}
        <div className="flex-1 relative z-10 flex items-center justify-center p-6 pb-32">
            
            <AnimatePresence mode="wait">
                {isGenerating ? (
                    <motion.div 
                        key="generating"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="relative flex flex-col items-center justify-center p-8 bg-slate-900/80 border border-white/10 rounded-[2rem] backdrop-blur-xl shadow-2xl w-full max-w-[320px] aspect-square"
                    >
                         {/* Progress Ring - Mobile Optimized */}
                        <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                            {/* Decorative Outer Glow */}
                            <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                            
                            {/* SVG with overflow-visible */}
                            <svg className="w-full h-full -rotate-90 drop-shadow-lg overflow-visible" viewBox="0 0 160 160">
                                {/* Track Background */}
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    stroke="currentColor" 
                                    strokeWidth="12" 
                                    fill="transparent" 
                                    className="text-slate-800" 
                                />
                                {/* Progress Indicator */}
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    stroke="currentColor" 
                                    strokeWidth="12" 
                                    fill="transparent" 
                                    className="text-blue-500 transition-all duration-300 ease-out" 
                                    strokeDasharray={440} 
                                    strokeDashoffset={440 - (440 * progress) / 100} 
                                    strokeLinecap="round" 
                                    style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))" }}
                                />
                            </svg>
                            
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-white font-mono tracking-tighter drop-shadow-md">
                                    {Math.round(progress)}<span className="text-lg text-blue-400 align-top">%</span>
                                </span>
                                {queueSize > 0 && (
                                    <span className="text-[10px] text-blue-300 mt-1 uppercase tracking-wider font-bold bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-500/20">
                                        队列: {queueSize}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1">
                            <h3 className="text-lg font-bold text-white tracking-wide animate-pulse">正在生成...</h3>
                            <p className="text-xs text-slate-500 font-medium">ComfyUI 正在处理节点</p>
                        </div>
                    </motion.div>
                ) : currentImage ? (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group w-full h-full flex items-center justify-center"
                    >
                         <img 
                            src={currentImage.url} 
                            alt="Result" 
                            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/5 bg-slate-900/50"
                            onClick={() => setIsZoomed(true)}
                        />
                        
                        {/* Overlay Controls */}
                        <div className="absolute bottom-4 right-4 flex gap-2">
                             <button onClick={() => setIsZoomed(true)} className="bg-black/60 text-white p-3 rounded-full backdrop-blur border border-white/10 shadow-lg active:scale-95 transition-transform">
                                <Maximize2 className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6"
                    >
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-6 group hover:rotate-0 transition-all duration-500">
                                <Aperture className="w-10 h-10 text-slate-600 group-hover:text-blue-500 transition-colors duration-500" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">准备就绪</h2>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-[200px] mx-auto">
                                点击下方按钮开始生成<br/>AI 创意即刻呈现
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Floating Action Button (FAB) - Fixed Bottom Position for Mobile */}
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <motion.button
                variants={fabVariants}
                initial="initial"
                animate="animate"
                whileTap="tap"
                onClick={isGenerating ? onInterrupt : onGenerate}
                disabled={!isConnected || !hasWorkflow}
                className={`pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg tracking-wide uppercase transition-all border border-white/10 backdrop-blur-md ${
                    !isConnected || !hasWorkflow ? 'bg-slate-800/90 text-slate-500 cursor-not-allowed grayscale' :
                    isGenerating 
                        ? 'bg-red-500/90 text-white shadow-red-900/30 hover:bg-red-500' 
                        : 'bg-blue-600/90 text-white shadow-blue-900/30 hover:bg-blue-600'
                }`}
            >
                {isGenerating ? (
                    <>
                        <Square className="w-5 h-5 fill-current" /> <span className="drop-shadow-sm">停止</span>
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5 fill-current" /> <span className="drop-shadow-sm">开始生成</span>
                    </>
                )}
            </motion.button>
        </div>

        {/* Full Screen Zoom Modal */}
        {isZoomed && currentImage && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center" onClick={() => setIsZoomed(false)}>
                <img src={currentImage.url} className="max-w-full max-h-full object-contain" />
                <button className="absolute top-safe right-4 text-white/70 hover:text-white p-2 bg-black/20 rounded-full backdrop-blur-md mt-4"><X className="w-8 h-8" /></button>
                <a href={currentImage.url} download className="absolute bottom-10 bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-transform">
                    <Download className="w-4 h-4" /> 保存图片
                </a>
            </div>
        )}
    </div>
  );
};
