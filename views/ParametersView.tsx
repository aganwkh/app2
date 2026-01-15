import React, { useRef } from 'react';
import { Upload, Settings2, Sparkles, AlertOctagon, CheckCircle2, RefreshCw, Lock, FlaskConical, Dices, Layers, Plug, Plus, Trash2, Wand2 } from 'lucide-react';
import { DetectedField, DetectedModel, DetectedLora } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ParametersViewProps {
  comfyUrl: string;
  setComfyUrl: (url: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onConnect: () => void;
  onFileUpload: (file: File) => void;
  detectedFields: DetectedField[];
  detectedModels: DetectedModel[];
  detectedLoras: DetectedLora[];
  availableLoras: string[];
  onFieldChange: (nodeId: string, field: string, value: string | number) => void;
  onLoraChange: (nodeId: string, updates: Partial<DetectedLora>) => void;
  autoSeed: boolean;
  setAutoSeed: (val: boolean) => void;
  onAddLora: () => void;
  onRemoveLora: (nodeId: string) => void;
  onCopyTriggers?: () => void;
}

export const ParametersView: React.FC<ParametersViewProps> = ({
  comfyUrl,
  setComfyUrl,
  isDemoMode,
  setIsDemoMode,
  connectionStatus,
  onConnect,
  onFileUpload,
  detectedFields,
  detectedModels,
  detectedLoras,
  availableLoras,
  onFieldChange,
  onLoraChange,
  autoSeed,
  setAutoSeed,
  onAddLora,
  onRemoveLora,
  onCopyTriggers
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dynamicPrompts = detectedFields.filter(f => f.type === 'prompt' && f.subType === 'dynamic');
  const positivePrompts = detectedFields.filter(f => f.type === 'prompt' && f.subType === 'positive');
  const negativePrompts = detectedFields.filter(f => f.type === 'prompt' && f.subType === 'negative');
  // General fallback for unclassified text fields
  const generalPrompts = detectedFields.filter(f => f.type === 'prompt' && f.subType === 'general');
  const settings = detectedFields.filter(f => f.type === 'number');

  // Animation variants
  const fadeIn = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="w-full p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-500" />
                    配置
                </h2>
                <button 
                  onClick={() => setIsDemoMode(!isDemoMode)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 active:scale-95 ${
                    isDemoMode 
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <FlaskConical className="w-3 h-3" />
                  {isDemoMode ? '演示' : '实机'}
                </button>
             </div>
             
             {/* URL Input - Mobile Friendly */}
             {!isDemoMode && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={comfyUrl}
                            onChange={(e) => setComfyUrl(e.target.value)}
                            placeholder="ws://..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={onConnect}
                        disabled={connectionStatus === 'connected'}
                        className={`px-5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                            connectionStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        }`}
                    >
                        {connectionStatus === 'connected' ? <CheckCircle2 className="w-5 h-5"/> : '连接'}
                    </button>
                </div>
             )}
      </div>

      {/* File Upload - Touch Optimized */}
      <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-slate-800 bg-slate-900/50 rounded-xl p-5 flex items-center justify-center gap-3 cursor-pointer active:bg-slate-800 transition-colors active:scale-[0.98]"
      >
          <Upload className="w-5 h-5 text-slate-500" />
          <span className="text-sm text-slate-400">加载工作流 (.json)</span>
          <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} className="hidden" />
      </div>

      {/* Checkpoint Models */}
      {detectedModels.length > 0 && (
        <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Settings2 className="w-3 h-3"/> 基础模型
             </label>
             <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none touch-pan-x">
                {detectedModels.map((model, idx) => (
                    <div key={`${model.nodeId}-${idx}`} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-300">{model.name}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* LoRA Stack Section */}
      {(detectedModels.length > 0 || isDemoMode) && (
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1.5">
                    <Plug className="w-3.5 h-3.5" /> LoRA 堆叠 ({detectedLoras.length})
                </label>
                <div className="flex items-center gap-2">
                    {onCopyTriggers && detectedLoras.length > 0 && (
                        <button
                            onClick={onCopyTriggers}
                            className="flex items-center gap-1 text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all active:scale-95"
                        >
                            <Wand2 className="w-3 h-3" /> 填入词
                        </button>
                    )}
                    <button 
                        onClick={onAddLora}
                        className="flex items-center gap-1 text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20 transition-all active:scale-95"
                    >
                        <Plus className="w-3 h-3" /> 添加
                    </button>
                </div>
             </div>
             
             {detectedLoras.length === 0 ? (
                 <div className="p-4 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-2 min-h-[100px]">
                     <Layers className="w-6 h-6 opacity-30" />
                     <span className="text-xs">无 LoRA 加载</span>
                 </div>
             ) : (
                 <div className="space-y-3">
                     <AnimatePresence initial={false}>
                        {detectedLoras.map((lora, idx) => (
                            <motion.div 
                                key={lora.nodeId}
                                initial="hidden" animate="visible" exit={{ opacity: 0, height: 0 }} variants={fadeIn}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />
                                
                                {/* Delete Button - Enlarged Touch Target */}
                                <button 
                                    onClick={() => onRemoveLora(lora.nodeId)}
                                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors z-10 bg-slate-950/50 rounded-full active:scale-90"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                
                                {/* Lora Selector */}
                                <div className="relative pr-8">
                                    <Layers className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 pointer-events-none" />
                                    <select 
                                        value={lora.name}
                                        onChange={(e) => onLoraChange(lora.nodeId, { name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700/50 rounded-lg py-3 pl-10 pr-8 text-xs text-slate-200 appearance-none outline-none focus:border-purple-500/50 transition-colors"
                                    >
                                        <option value={lora.name}>{lora.name} {lora.isNew ? '(新增)' : ''}</option>
                                        {availableLoras.filter(n => n !== lora.name).map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-8 top-3.5 pointer-events-none text-slate-500 text-[10px]">▼</div>
                                </div>

                                {/* Sliders Container - Mobile Optimized */}
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-400">Model 权重</span>
                                            <span className="font-mono text-purple-300">{lora.strength_model.toFixed(1)}</span>
                                        </div>
                                        <input 
                                            type="range" min="-2" max="4" step="0.1"
                                            value={lora.strength_model}
                                            onChange={(e) => onLoraChange(lora.nodeId, { strength_model: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-slate-800 rounded-full appearance-none accent-purple-500 cursor-pointer touch-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-400">CLIP 权重</span>
                                            <span className="font-mono text-pink-300">{lora.strength_clip.toFixed(1)}</span>
                                        </div>
                                        <input 
                                            type="range" min="-2" max="4" step="0.1"
                                            value={lora.strength_clip}
                                            onChange={(e) => onLoraChange(lora.nodeId, { strength_clip: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-slate-800 rounded-full appearance-none accent-pink-500 cursor-pointer touch-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                     </AnimatePresence>
                 </div>
             )}
          </div>
      )}

      {/* Prompts Section */}
      <div className="space-y-6">
          {/* Dynamic Prompts */}
          {dynamicPrompts.length > 0 && (
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1.5">
                    <Dices className="w-3.5 h-3.5" /> 动态提示词
                </label>
                {dynamicPrompts.map(field => (
                    <div key={`${field.nodeId}-${field.field}`} className="relative group">
                        <textarea
                            value={field.value}
                            onChange={(e) => onFieldChange(field.nodeId, field.field, e.target.value)}
                            placeholder="__wildcards__"
                            className="w-full h-32 bg-slate-900/80 border border-purple-500/30 focus:border-purple-500 rounded-xl p-3 text-sm text-purple-100 placeholder:text-purple-500/30 outline-none resize-none shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all font-mono"
                        />
                         <div className="text-[9px] text-slate-500 text-right pr-1 pt-1 opacity-50">{field.label}</div>
                    </div>
                ))}
             </div>
          )}

          {/* Positive Prompts */}
          {positivePrompts.length > 0 && (
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-green-500" /> 正向提示词
                </label>
                {positivePrompts.map(field => (
                   <div key={`${field.nodeId}-${field.field}`}>
                        <textarea
                            value={field.value}
                            onChange={(e) => onFieldChange(field.nodeId, field.field, e.target.value)}
                            className="w-full h-40 bg-slate-900 border border-slate-800 focus:border-green-500/50 rounded-xl p-3 text-sm text-slate-200 outline-none resize-none leading-relaxed"
                            placeholder="描述你想要的画面..."
                        />
                         <div className="text-[9px] text-slate-500 text-right pr-1 pt-1 opacity-50">{field.label}</div>
                   </div>
                ))}
             </div>
          )}
          
          {/* Negative Prompts */}
          {negativePrompts.length > 0 && (
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3 text-red-500" /> 负向提示词
                </label>
                {negativePrompts.map(field => (
                    <div key={`${field.nodeId}-${field.field}`}>
                        <textarea
                            value={field.value}
                            onChange={(e) => onFieldChange(field.nodeId, field.field, e.target.value)}
                            className="w-full h-24 bg-slate-900 border border-slate-800 focus:border-red-500/50 rounded-xl p-3 text-sm text-slate-200 outline-none resize-none leading-relaxed"
                            placeholder="描述你不想要的..."
                        />
                        <div className="text-[9px] text-slate-500 text-right pr-1 pt-1 opacity-50">{field.label}</div>
                    </div>
                ))}
             </div>
          )}

           {/* General Prompts (Fallback) */}
           {generalPrompts.length > 0 && (
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Settings2 className="w-3 h-3" /> 其他文本输入
                </label>
                {generalPrompts.map(field => (
                    <div key={`${field.nodeId}-${field.field}`}>
                        <textarea
                            value={field.value}
                            onChange={(e) => onFieldChange(field.nodeId, field.field, e.target.value)}
                            className="w-full h-20 bg-slate-900 border border-slate-800 focus:border-blue-500/50 rounded-xl p-3 text-sm text-slate-200 outline-none resize-none"
                        />
                        <div className="text-[9px] text-slate-500 text-right pr-1 pt-1 opacity-50">{field.label}</div>
                    </div>
                ))}
             </div>
          )}
      </div>

      {/* Numeric Settings */}
      {settings.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase">生成参数</label>
            <div className="grid grid-cols-1 gap-3">
                {settings.map(field => {
                    const isSeed = field.label.toLowerCase().includes('seed');
                    return (
                        <div key={`${field.nodeId}-${field.field}`} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-medium text-slate-400 uppercase">{field.label}</span>
                                </div>
                                {!isSeed && (
                                     <input 
                                        type="range"
                                        min={field.min} max={field.max} step={field.step || 1}
                                        value={field.value}
                                        onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none accent-blue-500 cursor-pointer touch-none"
                                    />
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={field.value}
                                    disabled={isSeed && autoSeed}
                                    onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value) || 0)}
                                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg py-2 text-center text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
                                />
                                {isSeed && (
                                    <button 
                                        onClick={() => setAutoSeed(!autoSeed)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg border active:scale-95 transition-all ${autoSeed ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        {autoSeed ? <RefreshCw className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};