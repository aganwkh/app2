import React from 'react';
import { Upload, Play, Square, RefreshCw, Link as LinkIcon, CheckCircle2, Settings2, FlaskConical, Box, Component, Lock, PlusCircle, Sparkles, AlertOctagon } from 'lucide-react';
import { DetectedField, DetectedModel } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  comfyUrl: string;
  setComfyUrl: (url: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  onConnect: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onFileUpload: (file: File) => void;
  detectedFields: DetectedField[];
  detectedModels: DetectedModel[];
  onFieldChange: (nodeId: string, field: string, value: string | number) => void;
  onGenerate: () => void;
  onInterrupt: () => void;
  isGenerating: boolean;
  progress: number;
  autoSeed: boolean;
  setAutoSeed: (val: boolean) => void;
  queueSize: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  comfyUrl,
  setComfyUrl,
  isDemoMode,
  setIsDemoMode,
  onConnect,
  connectionStatus,
  onFileUpload,
  detectedFields,
  detectedModels,
  onFieldChange,
  onGenerate,
  onInterrupt,
  isGenerating,
  progress,
  autoSeed,
  setAutoSeed,
  queueSize
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const positivePrompts = detectedFields.filter(f => f.type === 'prompt' && f.subType !== 'negative');
  const negativePrompts = detectedFields.filter(f => f.type === 'prompt' && f.subType === 'negative');
  const settings = detectedFields.filter(f => f.type === 'number');

  // Animation variants
  const buttonTap = { scale: 0.95 };

  return (
    <div className="w-full md:w-80 flex-shrink-0 flex flex-col h-screen z-10 relative border-r border-white/5 bg-slate-900/80 backdrop-blur-md shadow-2xl">
      
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] transition-all duration-500 ${
                connectionStatus === 'connected' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-red-500 shadow-red-500/50'
            }`}></div>
            ComfyUI
        </h1>
        <div className="flex items-center gap-2">
           <motion.button 
             whileTap={buttonTap}
             onClick={() => setIsDemoMode(!isDemoMode)}
             className={`p-1.5 rounded-lg transition-all border ${isDemoMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300'}`}
             title="切换演示模式"
           >
             <FlaskConical className="w-4 h-4" />
           </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        
        {/* Connection Box */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${isDemoMode ? 'bg-purple-500/5 border-purple-500/10' : 'bg-slate-800/40 border-white/5'}`}>
          <div className="flex items-center justify-between mb-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
               {isDemoMode ? '演示模式运行中' : '服务器连接'}
             </label>
             {connectionStatus === 'connected' && <CheckCircle2 className="w-3 h-3 text-emerald-500"/>}
          </div>
          
          {!isDemoMode ? (
            <div className="flex flex-col gap-2">
                <div className="relative group">
                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={comfyUrl}
                        onChange={(e) => setComfyUrl(e.target.value)}
                        placeholder="http://127.0.0.1:8188"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-mono"
                    />
                </div>
                <motion.button
                whileTap={buttonTap}
                onClick={onConnect}
                disabled={connectionStatus === 'connected'}
                className={`w-full py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    connectionStatus === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
                >
                {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '连接'}
                </motion.button>
            </div>
          ) : (
             <div className="text-xs text-purple-300/80 leading-relaxed">
               模拟模式已启用。
             </div>
          )}
        </div>

        {/* Workflow Upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">工作流 API</label>
          <motion.div 
            whileTap={buttonTap}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-slate-600/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group relative overflow-hidden bg-slate-800/20"
          >
            <Upload className="w-6 h-6 text-slate-500 group-hover:text-blue-400 mb-2 transition-colors duration-300" />
            <span className="text-xs text-slate-400 font-medium group-hover:text-slate-200 transition-colors">加载 .json 工作流文件</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
        </div>
        
        {/* Model Info Display */}
        {detectedModels.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Box className="w-3 h-3" /> 使用模型
                </label>
                <div className="space-y-2">
                    {detectedModels.map((model, idx) => (
                        <div key={`${model.nodeId}-${idx}`} className="bg-slate-800/40 rounded-lg p-2 border border-white/5 text-xs flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full flex-shrink-0 ${model.type === 'checkpoint' ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                             <span className="text-slate-300 truncate" title={model.name}>{model.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- POSITIVE PROMPTS --- */}
        {positivePrompts.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-green-400" /> 正向提示词
            </label>
            {positivePrompts.map((field) => (
            <div key={field.nodeId} className="group">
                <textarea
                    value={field.value}
                    onChange={(e) => onFieldChange(field.nodeId, field.field, e.target.value)}
                    className="w-full bg-slate-800/40 border border-green-500/20 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:bg-slate-800/60 min-h-[100px] resize-y placeholder:text-slate-600/50 font-light leading-relaxed transition-all scrollbar-thin scrollbar-thumb-slate-700"
                    placeholder="Masterpiece, best quality..."
                />
            </div>
            ))}
          </div>
        )}

        {/* --- NEGATIVE PROMPTS --- */}
        {negativePrompts.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <AlertOctagon className="w-3 h-3 text-red-400" /> 负向提示词
            </label>
            {negativePrompts.map((field) => (
            <div key={field.nodeId} className="group">
                <textarea
                    value={field.value}
                    onChange={(e) => onFieldChange(field.nodeId, field.field, e.target.value)}
                    className="w-full bg-slate-800/40 border border-red-500/20 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:bg-slate-800/60 min-h-[80px] resize-y placeholder:text-slate-600/50 font-light leading-relaxed transition-all scrollbar-thin scrollbar-thumb-slate-700"
                    placeholder="Low quality, bad hands..."
                />
            </div>
            ))}
          </div>
        )}

        {/* --- NUMERIC PARAMETERS --- */}
        {settings.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between pl-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Settings2 className="w-3 h-3"/> 数值参数
                    </label>
                </div>
                
                <div className="space-y-3">
                    {settings.map((field) => {
                        const isSeed = field.label.toLowerCase().includes('seed');
                        return (
                        <div key={`${field.nodeId}-${field.label}`} className="bg-slate-800/30 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{field.label}</label>
                                <span className="text-[10px] font-mono text-slate-500">{field.value}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Slider */}
                                {(field.min !== undefined && field.max !== undefined) && !isSeed && (
                                    <input 
                                        type="range"
                                        min={field.min}
                                        max={field.max}
                                        step={field.step || 1}
                                        value={field.value}
                                        onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value))}
                                        className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                                    />
                                )}

                                {/* Number Input */}
                                <input
                                    type="number"
                                    value={field.value}
                                    step={field.step || 1}
                                    min={field.min}
                                    disabled={isSeed && autoSeed}
                                    onChange={(e) => onFieldChange(field.nodeId, field.field, parseFloat(e.target.value) || 0)}
                                    className={`bg-slate-900/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-right text-slate-200 focus:outline-none focus:border-blue-500/50 font-mono ${isSeed ? 'flex-1 disabled:opacity-50' : 'w-20'}`}
                                />
                                
                                {/* Seed Special Controls */}
                                {isSeed && (
                                    <motion.button 
                                        whileTap={buttonTap}
                                        onClick={() => setAutoSeed(!autoSeed)}
                                        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${autoSeed ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-700/50 text-slate-400 border border-transparent'}`}
                                        title={autoSeed ? "随机模式 (生成时自动刷新)" : "锁定模式 (使用当前值)"}
                                    >
                                        {autoSeed ? <RefreshCw className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-white/5 bg-slate-900/40 backdrop-blur z-20">
        {isGenerating ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
                        {queueSize > 0 ? `队列中 (${queueSize})` : '正在生成...'}
                    </span>
                    <span className="font-mono text-blue-400">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                
                {queueSize > 0 ? (
                    <motion.button
                        whileTap={buttonTap}
                        onClick={onGenerate}
                        className="w-full py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wide"
                    >
                        <PlusCircle className="w-3.5 h-3.5" /> 追加任务 (+1)
                    </motion.button>
                ) : (
                    <motion.button
                        whileTap={buttonTap}
                        onClick={onInterrupt}
                        className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wide"
                    >
                        <Square className="w-3.5 h-3.5 fill-current" /> 停止生成
                    </motion.button>
                )}
            </div>
        ) : (
            <motion.button
                whileTap={buttonTap}
                onClick={onGenerate}
                disabled={(!isDemoMode && connectionStatus !== 'connected') || detectedFields.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                    (!isDemoMode && connectionStatus !== 'connected') || detectedFields.length === 0
                        ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5'
                        : isDemoMode 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/30'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/30'
                }`}
            >
                <Play className="w-4 h-4 fill-current" /> 
                {detectedFields.length === 0 ? '请先上传工作流' : '开始生成'}
            </motion.button>
        )}
      </div>
    </div>
  );
};