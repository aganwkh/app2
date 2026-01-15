import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { Download, Maximize2, X, Aperture, Play, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';

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
  currentImage, isGenerating, progress, queueSize, onGenerate, onInterrupt, isConnected, hasWorkflow
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // --- NATIVE BACK BUTTON HANDLING FOR ZOOM ---
  useEffect(() => {
    if (isZoomed) {
        window.history.pushState({ zoomed: true }, '');
        const handlePopState = () => setIsZoomed(false);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isZoomed]);

  const handleZoomClose = () => window.history.back();

  return (
    <div className="relative w-full min-h-full flex flex-col bg-transparent">
        <div className="flex-1 relative z-10 flex items-center justify-center p-6 pb-32">
            <AnimatePresence mode="wait">
                {isGenerating ? (
                    <motion.div key="gen" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl aspect-square w-full max-w-[320px]">
                        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                            {/* Glowing rings */}
                            <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full animate-[spin_4s_linear_infinite]" />
                            <div className="absolute inset-4 border-4 border-purple-500/10 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                            
                            <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-visible" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="8" fill="transparent" className="opacity-20" />
                                <circle cx="80" cy="80" r="70" stroke="url(#gradient)" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * progress) / 100} strokeLinecap="round" className="transition-all duration-300 ease-linear" />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-bold text-white font-mono tracking-tighter">{Math.round(progress)}<span className="text-xl text-blue-400">%</span></span>
                                {queueSize > 0 && <span className="text-[10px] text-blue-200 mt-2 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/20 backdrop-blur-sm">Queue: {queueSize}</span>}
                            </div>
                        </div>
                        <h3 className="text-base font-medium text-slate-300 animate-pulse tracking-widest uppercase">正在生成</h3>
                    </motion.div>
                ) : currentImage ? (
                    <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group w-full h-full flex items-center justify-center">
                         <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-50" />
                         <motion.img 
                            layoutId="latest-gen"
                            src={currentImage.url} 
                            className="relative max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black/20"
                            onClick={() => setIsZoomed(true)}
                        />
                        <button onClick={() => setIsZoomed(true)} className="absolute bottom-6 right-6 bg-black/40 text-white p-3 rounded-full backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
                        <div className="relative w-32 h-32 mx-auto">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-2xl animate-pulse" />
                            <div className="relative w-full h-full bg-slate-900/30 border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl backdrop-blur-md">
                                <Aperture className="w-12 h-12 text-slate-500/80" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">ComfyUI Ready</h2>
                            <p className="text-slate-400 text-sm">点击下方按钮开始创作</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none px-6">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isGenerating ? onInterrupt : onGenerate}
                disabled={!isConnected || !hasWorkflow}
                className={`pointer-events-auto w-full max-w-md py-4 rounded-2xl font-bold text-base tracking-wide uppercase shadow-2xl backdrop-blur-xl border border-white/10 flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-red-500/20 text-red-200 border-red-500/30 shadow-red-900/20' : 'bg-blue-600/80 text-white shadow-blue-900/40 hover:bg-blue-500/80'}`}
            >
                {isGenerating ? <><Square className="w-5 h-5 fill-current"/> 停止生成</> : <><Play className="w-5 h-5 fill-current"/> 开始生成</>}
            </motion.button>
        </div>

        <AnimatePresence>
            {isZoomed && currentImage && (
                <ZoomModal image={currentImage} onClose={handleZoomClose} />
            )}
        </AnimatePresence>
    </div>
  );
};

const ZoomModal: React.FC<{ image: GeneratedImage, onClose: () => void }> = ({ image, onClose }) => {
    const y = useMotionValue(0);
    const bgOpacity = useTransform(y, [-200, 0, 200], [0, 1, 0]);
    const scale = useTransform(y, [-200, 0, 200], [0.85, 1, 0.85]);
    const controls = useAnimation();

    return (
        <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-3xl"
            style={{ backgroundColor: useTransform(bgOpacity, o => `rgba(0,0,0,${o * 0.6})`) }}
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            exit={{ backgroundColor: "rgba(0,0,0,0)" }}
        >
            <motion.div
                className="w-full h-full flex items-center justify-center touch-none"
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.7}
                style={{ y, scale }} animate={controls}
                onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.y) > 100) onClose();
                    else controls.start({ y: 0, scale: 1 });
                }}
            >
                <motion.img 
                    layoutId="latest-gen"
                    src={image.url} 
                    className="max-w-full max-h-full object-contain drop-shadow-2xl"
                />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                 <a href={image.url} download className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-8 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 pointer-events-auto active:scale-95 hover:bg-white/20 transition-colors">
                    <Download className="w-4 h-4" /> 保存图片
                </a>
            </motion.div>
        </motion.div>
    );
}
