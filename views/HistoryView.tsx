import React, { useMemo, useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { Trash2, Image as ImageIcon, Clock, X, Download, RefreshCw, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface HistoryViewProps {
  history: GeneratedImage[];
  onSelect: (img: GeneratedImage) => void;
  onClear: () => void;
  onDelete?: (img: GeneratedImage) => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onClear, onDelete }) => {
  // Store index instead of object to facilitate navigation
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [showMeta, setShowMeta] = useState(false);

  // Performance: Memoize reversed array (Newest first)
  const reversedHistory = useMemo(() => history.slice().reverse(), [history]);

  const selectedImage = selectedIndex !== null ? reversedHistory[selectedIndex] : null;

  // Handle Image Navigation
  const paginate = (newDirection: number) => {
    if (selectedIndex === null) return;
    
    const newIndex = selectedIndex + newDirection;
    
    // Bounds check
    if (newIndex >= 0 && newIndex < reversedHistory.length) {
        setDirection(newDirection);
        setSelectedIndex(newIndex);
    }
  };
  
  const handleDeleteCurrent = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedImage && onDelete) {
          if (confirm("确定要删除这张图片吗？")) {
              onDelete(selectedImage);
              // Adjust selection index after deletion
              if (reversedHistory.length <= 1) {
                  setSelectedIndex(null);
              } else if (selectedIndex >= reversedHistory.length - 1) {
                  setSelectedIndex(reversedHistory.length - 2);
              }
              // Force strict mode react render update visually if needed
          }
      }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, reversedHistory.length]);

  // Animation Variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      transition: {
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <div className="w-full min-h-full bg-slate-950 pb-32 animate-in fade-in duration-300">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between transition-all">
            <div className="flex flex-col">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                    图库
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono font-normal">
                        {history.length}
                    </span>
                </h2>
            </div>
            {history.length > 0 && (
                <button 
                    onClick={onClear}
                    className="p-2 bg-slate-900/50 text-slate-400 hover:text-red-400 rounded-full transition-colors border border-white/5 active:scale-95 active:bg-red-500/10"
                    title="清空所有"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>

        {/* Empty State */}
        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-600">
                <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium text-slate-500">暂无历史记录</p>
                <p className="text-xs text-slate-600 mt-1">生成的作品将自动保存在此处</p>
            </div>
        ) : (
            /* Immersive Grid Layout */
            <div className="grid grid-cols-2 gap-0.5 p-0.5 pb-20">
                {reversedHistory.map((img, idx) => {
                    // Extract minimal metadata for display
                    const seed = img.metadata?.fields.find(f => f.field === 'seed' || f.field === 'noise_seed')?.value;
                    const timestamp = img.metadata?.timestamp;
                    const key = img.id || `${img.filename}-${idx}`;
                    
                    return (
                        <div 
                            key={key}
                            onClick={() => { setSelectedIndex(idx); setDirection(0); }}
                            className="group relative aspect-[4/5] bg-slate-900 overflow-hidden cursor-pointer active:opacity-90 transition-opacity"
                        >
                            <img 
                                src={img.url} 
                                alt={img.filename} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            
                            {/* Cinematic Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60" />

                            {/* Minimal Info Badge */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
                                <div className="flex flex-col gap-0.5">
                                    {timestamp && (
                                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1 backdrop-blur-sm px-1.5 py-0.5 rounded-full bg-black/20 w-fit">
                                            <Clock className="w-2.5 h-2.5" />
                                            {new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    )}
                                    {seed && (
                                        <span className="text-[10px] text-white font-mono opacity-90 tracking-wider pl-1 font-bold shadow-black drop-shadow-sm">
                                            #{String(seed).slice(-4)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Tap Highlight */}
                            <div className="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 pointer-events-none transition-opacity duration-200" />
                        </div>
                    );
                })}
            </div>
        )}

        {/* Full Screen Image Viewer Modal (Carousel) */}
        <AnimatePresence>
            {selectedImage && selectedIndex !== null && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black flex flex-col"
                >
                    {/* Top Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <span className="text-white/50 text-xs font-mono pt-3 pl-2">
                             {reversedHistory.length - selectedIndex} / {reversedHistory.length}
                        </span>
                        
                        <div className="flex gap-3 pointer-events-auto">
                            {onDelete && (
                                <button 
                                    onClick={handleDeleteCurrent}
                                    className="p-3 bg-red-500/20 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500/30 active:scale-95 transition-all shadow-lg border border-red-500/20"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedIndex(null)}
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Image Area with Swipe Gestures */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden relative w-full h-full">
                        
                        {/* Navigation Hints */}
                        {selectedIndex > 0 && (
                            <button onClick={() => paginate(-1)} className="absolute left-2 z-20 p-2 text-white/30 hover:text-white transition-colors bg-black/20 backdrop-blur rounded-full">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        {selectedIndex < reversedHistory.length - 1 && (
                            <button onClick={() => paginate(1)} className="absolute right-2 z-20 p-2 text-white/30 hover:text-white transition-colors bg-black/20 backdrop-blur rounded-full">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                            <motion.img
                                key={selectedImage.id || selectedImage.filename}
                                src={selectedImage.url}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                onClick={() => setShowMeta(!showMeta)}
                                className="absolute max-w-full max-h-full object-contain shadow-2xl cursor-grab active:cursor-grabbing"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.7}
                                onDragEnd={(e, { offset, velocity }: PanInfo) => {
                                    const swipe = swipePower(offset.x, velocity.x);

                                    if (swipe < -swipeConfidenceThreshold) {
                                        paginate(1); // Swipe Left -> Next Image
                                    } else if (swipe > swipeConfidenceThreshold) {
                                        paginate(-1); // Swipe Right -> Prev Image
                                    }
                                }}
                            />
                        </AnimatePresence>
                    </div>

                    {/* Metadata Overlay */}
                    <AnimatePresence>
                        {showMeta && selectedImage.metadata && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-20 left-4 right-4 bg-black/70 backdrop-blur-lg rounded-xl p-4 border border-white/10 z-10 pointer-events-none"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/10">
                                        <Layers className="w-3 h-3" /> 参数详情
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        {selectedImage.metadata.fields.filter(f => f.type === 'number').map(f => (
                                            <div key={f.field} className="text-slate-400">
                                                {f.label}: <span className="text-white font-mono">{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 text-[10px] text-slate-500">
                                        点击图片隐藏详情
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Action Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 space-y-4">
                        <div className="flex gap-3">
                             <a 
                                href={selectedImage.url} 
                                download={`comfy-gen-${Date.now()}.jpg`}
                                className="flex-1 py-3.5 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
                             >
                                <Download className="w-4 h-4" /> 保存
                             </a>
                             <button 
                                onClick={() => {
                                    onSelect(selectedImage);
                                    setSelectedIndex(null);
                                }}
                                className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-95 transition-all"
                             >
                                <RefreshCw className="w-4 h-4" /> 恢复参数并生成
                             </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};