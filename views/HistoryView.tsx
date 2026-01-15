import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GeneratedImage } from '../types';
import { Trash2, Image as ImageIcon, Download, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';

interface HistoryViewProps {
  history: GeneratedImage[];
  onSelect: (img: GeneratedImage) => void;
  onClear: () => void;
  onDelete?: (img: GeneratedImage) => void;
}

// Helpers for swipe detection
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onClear, onDelete }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [direction, setDirection] = useState(0); // 0 = zoom/open/close, 1 = next, -1 = prev
  const [showMeta, setShowMeta] = useState(false);
  
  // Use reversed history (Newest first)
  const reversedHistory = useMemo(() => history.slice().reverse(), [history]);
  
  // Calculate index for navigation
  const selectedIndex = useMemo(() => 
    selectedId ? reversedHistory.findIndex(img => (img.id || img.filename) === selectedId) : -1
  , [selectedId, reversedHistory]);

  const selectedImage = selectedIndex !== -1 ? reversedHistory[selectedIndex] : null;

  // --- NATIVE BACK BUTTON HANDLING ---
  useEffect(() => {
    if (selectedId) {
        window.history.pushState({ imageId: selectedId }, '');
        const handlePopState = () => {
            setDirection(0); // Reset direction to 0 to ensure 'zoom back' animation plays
            setSelectedId(null);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [selectedId]);

  const handleClose = () => {
      // Trigger native back, which calls handlePopState
      window.history.back(); 
  };

  const handleDeleteCurrent = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedImage && onDelete && confirm("确定要删除这张图片吗？")) {
          onDelete(selectedImage);
          // If we delete the last image, close viewer
          if (reversedHistory.length <= 1) {
              handleClose();
          } else {
              // Otherwise try to select the next available one
              const nextImg = reversedHistory[selectedIndex + 1] || reversedHistory[selectedIndex - 1];
              if (nextImg) setSelectedId(nextImg.id || nextImg.filename);
          }
      }
  };

  const paginate = (newDirection: number) => {
    if (selectedIndex === -1) return;
    const nextIndex = selectedIndex + newDirection;
    
    if (nextIndex >= 0 && nextIndex < reversedHistory.length) {
        setDirection(newDirection);
        const nextImg = reversedHistory[nextIndex];
        setSelectedId(nextImg.id || nextImg.filename);
    }
  };

  return (
    <div className="w-full min-h-full bg-transparent pb-32 animate-in fade-in duration-300">
        <div className="sticky top-0 z-30 bg-slate-950/40 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                图库
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800/60 border border-white/10 text-[10px] text-slate-300 font-mono font-normal backdrop-blur">
                    {history.length}
                </span>
            </h2>
            {history.length > 0 && (
                <button onClick={onClear} className="p-2 bg-slate-900/30 text-slate-400 hover:text-red-400 rounded-full border border-white/5 active:scale-95 transition-colors backdrop-blur-sm">
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>

        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <div className="w-20 h-20 bg-slate-800/30 rounded-3xl flex items-center justify-center mb-4 border border-white/5 backdrop-blur-md">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium text-slate-400/80">暂无历史记录</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-1 p-1 pb-20">
                {reversedHistory.map((img, idx) => {
                    const uniqueKey = img.id || `${img.filename}-${idx}`;
                    return (
                        <motion.div 
                            key={uniqueKey}
                            onClick={() => { setDirection(0); setSelectedId(uniqueKey); }}
                            className="relative aspect-[4/5] bg-slate-900/40 rounded-lg overflow-hidden cursor-pointer active:opacity-90 border border-white/5"
                        >
                             <motion.img 
                                layoutId={`image-${uniqueKey}`}
                                src={img.url} 
                                className="w-full h-full object-cover"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                                loading="lazy"
                            />
                        </motion.div>
                    );
                })}
            </div>
        )}

        <AnimatePresence initial={false} custom={direction}>
            {selectedImage && selectedId && (
                <ImageViewerModal 
                    key={selectedId} // Key change triggers enter/exit animations
                    image={selectedImage}
                    uniqueKey={selectedId}
                    custom={direction}
                    onClose={handleClose}
                    onNavigate={paginate}
                    hasNext={selectedIndex < reversedHistory.length - 1}
                    hasPrev={selectedIndex > 0}
                    onToggleMeta={() => setShowMeta(!showMeta)}
                    showMeta={showMeta}
                    onDelete={handleDeleteCurrent}
                    onUse={() => onSelect(selectedImage)}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

// --- MODAL COMPONENT ---

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 500 : direction < 0 ? -500 : 0,
    opacity: direction === 0 ? 1 : 0, // If direction is 0 (zoom), keep opacity 1 for layoutId
    scale: direction === 0 ? 1 : 0.8 // Only scale if sliding
  }),
  center: {
    zIndex: 1,
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 500 : direction > 0 ? -500 : 0,
    opacity: direction === 0 ? 1 : 0, // Keep visible if zooming back
    scale: direction === 0 ? 1 : 0.8
  })
};

const ImageViewerModal: React.FC<{
    image: GeneratedImage;
    uniqueKey: string;
    custom: number;
    onClose: () => void;
    onNavigate: (dir: number) => void;
    hasNext: boolean;
    hasPrev: boolean;
    onToggleMeta: () => void;
    showMeta: boolean;
    onDelete: (e: React.MouseEvent) => void;
    onUse: () => void;
}> = ({ image, uniqueKey, custom, onClose, onNavigate, hasNext, hasPrev, onToggleMeta, showMeta, onDelete, onUse }) => {
    // 2D Motion Values
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const isDraggingRef = useRef(false);
    
    // Background opacity only changes on vertical drag
    const bgOpacity = useTransform(y, [-300, 0, 300], [0, 1, 0]);
    // Scale image slightly on vertical drag
    const scale = useTransform(y, [-300, 0, 300], [0.85, 1, 0.85]);
    
    const controls = useAnimation();

    const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
        // Delay resetting the drag flag to prevent 'click' from firing immediately after release
        setTimeout(() => { isDraggingRef.current = false; }, 100);

        const swipe = swipePower(offset.x, velocity.x);
        
        // 1. Check for Vertical Dismiss (Priority)
        // If vertical movement is significant, close.
        if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
            onClose();
            return;
        }

        // 2. Check for Horizontal Navigation
        // Only if horizontal movement is dominant
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
             if (swipe < -swipeConfidenceThreshold && hasNext) {
                 onNavigate(1); // Swipe Left -> Next Image
             } else if (swipe > swipeConfidenceThreshold && hasPrev) {
                 onNavigate(-1); // Swipe Right -> Prev Image
             } else {
                 // Snap back if threshold not met
                 controls.start({ x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } });
             }
        } else {
            // Snap back vertical
            controls.start({ x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } });
        }
    };

    return (
        <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl"
            style={{ backgroundColor: useTransform(bgOpacity, o => `rgba(0,0,0,${o * 0.95})`) }}
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ backgroundColor: "rgba(0,0,0,0.95)" }}
            exit={{ backgroundColor: "rgba(0,0,0,0)", transition: { duration: 0.2 } }} // Faster backdrop fade
        >
            <motion.div
                className="w-full h-full flex items-center justify-center touch-none relative"
                drag // Enable free 2D drag
                dragElastic={0.7} // Add resistance
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Elastic snap back logic
                onDragStart={() => { isDraggingRef.current = true; }}
                onDragEnd={handleDragEnd}
                style={{ x, y, scale }}
                animate={controls}
                custom={custom}
                variants={variants}
                initial="enter"
                whileInView="center"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 400, damping: 30 }, // Snappier spring
                    opacity: { duration: 0.2 }
                }}
            >
                {/* Image */}
                <motion.img
                    layoutId={`image-${uniqueKey}`} // Shared layout transition
                    src={image.url}
                    className="max-w-[100vw] max-h-[100vh] object-contain shadow-2xl pointer-events-auto"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!isDraggingRef.current) onToggleMeta(); 
                    }}
                    draggable={false}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }} // Tune the layout transition (zoom speed)
                />
            </motion.div>

            {/* Navigation Arrows */}
            {hasPrev && (
                <button onClick={(e) => { e.stopPropagation(); onNavigate(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10 hidden md:block">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}
            {hasNext && (
                <button onClick={(e) => { e.stopPropagation(); onNavigate(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10 hidden md:block">
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
                {!showMeta && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none flex flex-col justify-end z-20">
                        <div className="pb-safe p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-auto space-y-4">
                            <div className="flex gap-3">
                                <a 
                                    href={image.url} 
                                    download={`gen-${Date.now()}.png`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <Download className="w-4 h-4" /> 保存
                                </a>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onUse(); onClose(); }} 
                                    className="flex-1 py-3.5 bg-blue-600/80 backdrop-blur-xl text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-900/20"
                                >
                                    <Layers className="w-4 h-4" /> 引用
                                </button>
                                {onDelete && (
                                    <button onClick={onDelete} className="p-3.5 bg-red-600/20 backdrop-blur-xl text-red-400 rounded-xl font-bold border border-red-500/20 active:scale-95">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                     </motion.div>
                )}
            </AnimatePresence>

            {/* Metadata Overlay */}
            <AnimatePresence>
                {showMeta && image.metadata && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-24 left-4 right-4 bg-slate-900/80 backdrop-blur-2xl rounded-2xl p-5 border border-white/10 z-20 pointer-events-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase pb-3 border-b border-white/10 mb-3">
                            <span className="flex items-center gap-2"><Layers className="w-3 h-3" /> 参数详情</span>
                            <span className="text-slate-500 font-mono">#{String(image.metadata.fields.find(f=>f.label.includes('Seed'))?.value || '').slice(-6)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {image.metadata.fields.filter(f => f.type === 'number').slice(0,6).map(f => (
                                <div key={f.field} className="bg-white/5 rounded p-2 border border-white/5">
                                    <span className="text-slate-400 text-[10px] block mb-0.5">{f.label.split('(')[0]}</span>
                                    <span className="text-white font-mono">{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
