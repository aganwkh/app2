import React, { useRef } from 'react';
import { Upload, Settings2, Sparkles, AlertOctagon, CheckCircle2, RefreshCw, Lock, FlaskConical, Dices, Layers, Plug, Plus, Trash2, Wand2, Box, Link as LinkIcon, Wifi } from 'lucide-react';
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
  const settings = detectedFields.filter(f => f.type === 'number');

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      
      {/* Immersive Sticky Header with Safe Area Padding */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pt-safe px-4 pb-3 shadow-lg shadow-black/20">
             <div className="flex items-center justify-between h-10">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-400" />
                    参数配置
                </h2>
                <div className="flex items-center gap-2">
                    {!isDemoMode && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
                            connectionStatus === 'connected' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {connectionStatus === 'connected' ? '已连接' : '未连接'}
                        </div>
                    )}
                    <button 
                    onClick={() => setIsDemoMode(!isDemoMode)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 active:scale-95 backdrop-blur-md ${
                        isDemoMode 
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-200' 
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                    >
                    <FlaskConical className="w-3 h-3" />
                    {isDemoMode ? '演示' : '实机'}
                    </button>
                </div>
             </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Connection Card (Only when needed) */}
        {!isDemoMode && connectionStatus !== 'connected' && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 text-slate-300">
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">服务器设置</span>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="relative group">
                        <LinkIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={comfyUrl}
                            onChange={(e) => setComfyUrl(e.target.value)}
                            placeholder="ws://192.168.1.100:8188"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <button
                        onClick={onConnect}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                    >
                        连接服务器
                    </button>
                </div>
            </div>
        )}

        {/* Workflow Uploader (Compact) */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-all hover:bg-white/10"
        >
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Upload className="w-5 h-5" />
            </div>
            <div className="text-left">
                <div className="text-sm font-medium text-slate-200">加载工作流</div>
                <div className="text-[10px] text-slate-500">支持 .json 格式文件</div>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} className="hidden" />
        </div>

        {/* Model Info */}
        {detectedModels.length > 0 && (
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Box className="w-3 h-3" /> 使用模型
                </label>
                <div className="flex flex-col gap-2">
                    {detectedModels.map((model, idx) => (
                        <div key={`${model.nodeId}-${idx}`} className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${model.type === 'checkpoint' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                <Box className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-500 uppercase">{model.type}</div>
                                <div className="text-xs text-slate-200 font-medium truncate">{model.name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* LoRA Section */}
        {(detectedLoras.length > 0 || availableLoras.length > 0) && (
            <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Plug className="w-3 h-3" /> LoRA 模型
                    </label>
                    <div className="flex gap-2">
                        {onCopyTriggers && (
                            <button onClick={onCopyTriggers} className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 active:scale-95">
                                触发词
                            </button>
                        )}
                        <button onClick={onAddLora} className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 active:scale-95">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                
                <AnimatePresence>
                {detectedLoras.map((lora) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        key={lora.nodeId} 
                        className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden"
                    >
                        <div className="p-3 border-b border-white/5 flex items-center gap-3 bg-white/5">
                            <div className={`w-1.5 h-8 rounded-full ${lora.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                            <div className="flex-1 min-w-0">
                                {lora.isNew ? (
                                    <select 
                                        value={lora.name}
                                        onChange={(e) => onLoraChange(lora.nodeId, { name: e.target.value })}
                                        className="w-full bg-black/40 text-xs text-white rounded-lg p-2 border border-white/10 outline-none"
                                    >
                                        {availableLoras.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                ) : (
                                    <div className="text-xs font-bold text-slate-200 truncate">{lora.name}</div>
                                )}
                            </div>
                            {lora.isNew && (
                                <button onClick={() => onRemoveLora(lora.nodeId)} className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="p-3 space-y-4">
                            {[
                                { label: 'Model Strength', val: lora.strength_model, key: 'strength_model', color: 'accent-emerald-500' },
                                { label: 'Clip Strength', val: lora.strength_clip, key: 'strength_clip', color: 'accent-purple-500' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-500 w-20">{item.label}</span>
                                    <input 
                                        type="range" min="0" max="2" step="0.1"
                                        value={item.val}
                                        onChange={(e) => onLoraChange(lora.nodeId, { [item.key]: parseFloat(e.target.value) })}
                                        className={`flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${item.color}`}
                                    />
                                    <span className="text-[10px] font-mono text-slate-300 w-6 text-right">{item.val.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        )}

        {/* Prompts - Using clean cards */}
        <div className="space-y-4">
            {[
                { items: dynamicPrompts, icon: Dices, color: 'text-purple-400', label: '动态提示词', borderColor: 'focus:border-purple-500/50' },
                { items: positivePrompts, icon: Sparkles, color: 'text-emerald-400', label: '正向提示词', borderColor: 'focus:border-emerald-500/50' },
                { items: negativePrompts, icon: AlertOctagon, color: 'text-red-400', label: '负面提示词', borderColor: 'focus:border-red-500/50' }
            ].map((section) => section.items.length > 0 && (
                <div key={section.label} className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                        <section.icon className={`w-3 h-3 ${section.color}`} /> {section.label}
                    </label>
                    {section.items.map(f => (
                        <textarea 
                            key={f.nodeId} 
                            value={f.value} 
                            onChange={(e) => onFieldChange(f.nodeId, f.field, e.target.value)} 
                            className={`w-full bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-1 min-h-[100px] resize-y placeholder:text-slate-600/50 backdrop-blur-md ${section.borderColor}`} 
                        />
                    ))}
                </div>
            ))}
        </div>

        {/* Numeric Settings - Single Column Layout for Better Touch Targets */}
        {settings.length > 0 && (
          <div className="space-y-3 pt-4">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <Settings2 className="w-3 h-3" /> 核心参数
               </label>
               
               {/* Vertical Stack instead of Grid for Mobile Optimization */}
               <div className="flex flex-col gap-3">
                   {settings.map(field => {
                        const isSeed = field.label.toLowerCase().includes('seed');
                        
                        // Seed specific layout
                        if (isSeed) {
                            return (
                                <div key={`${field.nodeId}-${field.label}`} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{field.label}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${autoSeed ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-700/50 text-slate-400 border-white/5'}`}>
                                            {autoSeed ? '随机' : '固定'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 h-11">
                                         <input
                                            type="number" value={field.value}
                                            disabled={autoSeed}
                                            onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value) || 0)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 text-sm text-slate-200 focus:border-blue-500/50 outline-none font-mono"
                                        />
                                        <button 
                                            onClick={() => setAutoSeed(!autoSeed)}
                                            className={`w-12 flex items-center justify-center rounded-xl transition-all border active:scale-95 ${
                                                autoSeed 
                                                ? 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-900/20' 
                                                : 'bg-slate-800 text-slate-400 border-white/10'
                                            }`}
                                        >
                                            {autoSeed ? <RefreshCw className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        // Normal numeric sliders
                        return (
                           <div key={`${field.nodeId}-${field.label}`} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                               <div className="flex justify-between items-center">
                                   <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{field.label.split('(')[0]}</span>
                                   <input
                                        type="number" value={field.value} step={field.step || 1}
                                        onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value) || 0)}
                                        className="bg-transparent border-none text-right text-sm text-blue-400 focus:text-white outline-none font-mono w-20 p-0"
                                    />
                               </div>
                               {(field.min !== undefined && field.max !== undefined) && (
                                   <input 
                                       type="range" min={field.min} max={field.max} step={field.step || 1} value={field.value}
                                       onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value))}
                                       className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                   />
                               )}
                           </div>
                        );
                   })}
               </div>
          </div>
        )}
      </div>
    </div>
  );
};