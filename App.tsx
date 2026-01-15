import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { ParametersView } from './views/ParametersView';
import { GenerateView } from './views/GenerateView';
import { HistoryView } from './views/HistoryView';
import { ComfyService } from './services/comfyService';
import { storageService } from './services/storageService';
import { DEFAULT_COMFY_URL, SAMPLER_NODE_TYPES, MODEL_NODE_TYPES, NUMBER_FIELDS, SEED_KEYS, TEXT_FIELD_CANDIDATES } from './constants';
import { ComfyWorkflow, DetectedField, DetectedModel, DetectedLora, GeneratedImage, WSMessage } from './types';

// Helper for Haptic Feedback
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (!navigator.vibrate) return;
    switch (style) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(20); break;
        case 'heavy': navigator.vibrate(40); break;
        case 'success': navigator.vibrate([10, 30, 10]); break;
        case 'error': navigator.vibrate([30, 50, 30]); break;
    }
};

// --- Ambient Background Component ---
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
    
    {/* Breathing Orbs */}
    <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[80px] opacity-30 animate-blob" />
    <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[80px] opacity-30 animate-blob animation-delay-2000" />
    <div className="absolute -bottom-32 left-20 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[80px] opacity-30 animate-blob animation-delay-4000" />
    
    {/* Grid Overlay for texture */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
    }}></div>
  </div>
);

const App: React.FC = () => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<TabType>('generate');

  // --- Core State ---
  const [comfyUrl, setComfyUrl] = useState<string>(() => localStorage.getItem('comfy_url') || DEFAULT_COMFY_URL);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => localStorage.getItem('is_demo_mode') === 'true');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [autoSeed, setAutoSeed] = useState<boolean>(true);

  // Workflow Data
  const [workflow, setWorkflow] = useState<ComfyWorkflow | null>(() => {
    try {
        const saved = localStorage.getItem('comfy_workflow');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [detectedModels, setDetectedModels] = useState<DetectedModel[]>([]);
  const [detectedLoras, setDetectedLoras] = useState<DetectedLora[]>([]);
  const [availableLoras, setAvailableLoras] = useState<string[]>([]);
  
  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [queueSize, setQueueSize] = useState(0); 
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  
  const serviceRef = useRef<ComfyService | null>(null);
  const queueRef = useRef<boolean>(false); 
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  // Ref to hold the latest state for callbacks
  const stateRef = useRef({ fields: detectedFields, models: detectedModels, loras: detectedLoras });

  // --- Effects ---
  
  // 1. Storage Persistence
  useEffect(() => {
    localStorage.setItem('comfy_url', comfyUrl);
    localStorage.setItem('is_demo_mode', String(isDemoMode));
  }, [comfyUrl, isDemoMode]);

  useEffect(() => {
    if (workflow) {
      localStorage.setItem('comfy_workflow', JSON.stringify(workflow));
    }
  }, [workflow]);

  useEffect(() => {
    stateRef.current = { fields: detectedFields, models: detectedModels, loras: detectedLoras };
  }, [detectedFields, detectedModels, detectedLoras]);

  // 2. Initial Load & Visibility
  useEffect(() => {
    if (workflow) {
        refreshDetectedState(workflow);
    }
    // Load local history from IndexedDB
    storageService.loadHistory().then(savedHistory => {
        if (savedHistory.length > 0) {
            setHistory(savedHistory);
        }
    });

    // Auto-reconnect on app foreground
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            if (!isDemoMode && serviceRef.current && connectionStatus === 'disconnected') {
                connect();
            }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 3. WAKE LOCK API
  useEffect(() => {
      const requestWakeLock = async () => {
          if ('wakeLock' in navigator && isGenerating) {
              try {
                  wakeLockRef.current = await navigator.wakeLock.request('screen');
              } catch (err) { console.log('Wake Lock request failed', err); }
          }
      };
      const releaseWakeLock = async () => {
          if (wakeLockRef.current) {
              await wakeLockRef.current.release();
              wakeLockRef.current = null;
          }
      };
      if (isGenerating) requestWakeLock();
      else releaseWakeLock();
      return () => { releaseWakeLock(); };
  }, [isGenerating]);

  // --- Helpers ---
  const getMetadataSnapshot = useCallback(() => ({
      fields: JSON.parse(JSON.stringify(stateRef.current.fields)),
      models: JSON.parse(JSON.stringify(stateRef.current.models)),
      loras: JSON.parse(JSON.stringify(stateRef.current.loras)),
      timestamp: Date.now()
  }), []);

  const updateField = (nodeId: string, fieldKey: string, value: string | number) => {
    if (!workflow) return;
    setDetectedFields(prev => prev.map(f => (f.nodeId === nodeId && f.field === fieldKey) ? { ...f, value } : f));
    setWorkflow(prevWf => {
        if (!prevWf) return null;
        const newWf = { ...prevWf };
        if (newWf[nodeId] && newWf[nodeId].inputs) {
            newWf[nodeId] = { ...newWf[nodeId], inputs: { ...newWf[nodeId].inputs, [fieldKey]: value } };
        }
        return newWf;
    });
  };

  const updateLora = (nodeId: string, updates: Partial<DetectedLora>) => {
      setDetectedLoras(prev => prev.map(l => l.nodeId === nodeId ? { ...l, ...updates } : l));
      setWorkflow(prevWf => {
          if (!prevWf) return null;
          const lora = stateRef.current.loras.find(l => l.nodeId === nodeId);
          if (lora && !lora.isNew && prevWf[nodeId]) {
              const newWf = { ...prevWf };
              const inputs = { ...newWf[nodeId].inputs };
              if (updates.name !== undefined) inputs.lora_name = updates.name;
              if (updates.strength_model !== undefined) inputs.strength_model = updates.strength_model;
              if (updates.strength_clip !== undefined) inputs.strength_clip = updates.strength_clip;
              newWf[nodeId] = { ...newWf[nodeId], inputs };
              return newWf;
          }
          return prevWf;
      });
  };

  const addLora = () => {
      triggerHaptic('light');
      const id = `new-lora-${Date.now()}`;
      setDetectedLoras(prev => [
          ...prev, 
          { nodeId: id, name: availableLoras[0] || "None", strength_model: 1.0, strength_clip: 1.0, isEnabled: true, isNew: true }
      ]);
  };

  const removeLora = (nodeId: string) => {
      triggerHaptic('light');
      setDetectedLoras(prev => prev.filter(l => l.nodeId !== nodeId));
  };

  const copyTriggerWords = () => {
      triggerHaptic('success');
      const activeLoras = detectedLoras.filter(l => l.isEnabled && l.name !== "None");
      if (activeLoras.length === 0) return;

      const triggers = activeLoras.map(l => {
          let name = l.name.replace(/\.(safetensors|ckpt|pt)$/i, "");
          return `<lora:${name}:1.0>`;
      }).join(", ");
      
      const candidates = detectedFields.filter(f => f.type === 'prompt' && f.subType === 'positive');
      const targetField = candidates[0] || detectedFields.find(f => f.type === 'prompt' && f.subType !== 'negative' && f.subType !== 'dynamic');

      if (targetField) {
          const currentVal = String(targetField.value || "");
          if (currentVal.includes(triggers)) { alert("LoRA 标签似乎已存在"); return; }
          updateField(targetField.nodeId, targetField.field, currentVal ? `${currentVal}, ${triggers}` : triggers);
          alert(`已添加 LoRA 标签`);
      } else {
          alert("未找到合适的正向提示词输入框");
      }
  };

  const handleClearHistory = async () => {
      triggerHaptic('medium');
      if (confirm("确定要清空所有历史记录吗？")) {
          await storageService.clearHistory();
          setHistory([]);
      }
  };

  const handleDeleteImage = async (img: GeneratedImage) => {
      triggerHaptic('medium');
      if (img.id) {
          const newHistory = await storageService.deleteImage(img.id);
          setHistory(newHistory);
      }
  };

  // --- WebSocket Logic ---
  const handleWSMessage = useCallback((event: MessageEvent) => {
    if (event.data instanceof Blob) {
        const blobUrl = URL.createObjectURL(event.data);
        setCurrentImage({
            filename: 'preview_temp.png', subfolder: '', type: 'preview', url: blobUrl, metadata: getMetadataSnapshot()
        });
        return;
    }
    if (typeof event.data === 'string') {
        try {
            const msg = JSON.parse(event.data) as WSMessage;
            switch (msg.type) {
                case 'execution_start':
                setIsGenerating(true); setProgress(0); triggerHaptic('light');
                break;
                case 'progress':
                if (msg.data.max > 0) setProgress((msg.data.value / msg.data.max) * 100);
                break;
                case 'executed':
                if (msg.data.output && msg.data.output.images) {
                    const metadata = getMetadataSnapshot();
                    const processImages = async () => {
                        const newImages: GeneratedImage[] = [];
                        for (const imgData of msg.data.output.images) {
                             const serverUrl = serviceRef.current?.getImageUrl(imgData) || '';
                             const tempImg: GeneratedImage = { id: crypto.randomUUID(), ...imgData, url: serverUrl, metadata: metadata };
                             const savedImg = await storageService.saveImage(tempImg);
                             newImages.push(savedImg);
                        }
                        if (newImages.length > 0) {
                             setCurrentImage(newImages[0]);
                             setHistory(prev => [...prev, ...newImages]);
                        }
                    };
                    processImages();
                }
                break;
                case 'execution_success':
                setIsGenerating(false); setProgress(100); triggerHaptic('success');
                if (queueRef.current) {
                    queueRef.current = false;
                    setQueueSize(prev => Math.max(0, prev - 1));
                    setTimeout(() => handleGenerate(), 300); 
                }
                break;
                case 'execution_error':
                setIsGenerating(false); queueRef.current = false; setQueueSize(0); triggerHaptic('error');
                alert('执行错误: ' + JSON.stringify(msg.data, null, 2));
                break;
            }
        } catch (e) { console.error("WS Parse Error", e); }
    }
  }, [getMetadataSnapshot]);

  const connect = useCallback(() => {
    triggerHaptic('light');
    if (isDemoMode) {
      setConnectionStatus('connecting');
      setTimeout(() => {
          setConnectionStatus('connected');
          setAvailableLoras(['demo_style_v1.safetensors', 'lighting_fix.safetensors', 'anime_outline.safetensors']);
          triggerHaptic('success');
      }, 600);
      return;
    }
    if (!comfyUrl) return;
    setConnectionStatus('connecting');
    if (serviceRef.current) serviceRef.current.disconnect();
    const service = new ComfyService(comfyUrl);
    serviceRef.current = service;
    service.connect(
      () => {
          setConnectionStatus('connected');
          triggerHaptic('success');
          service.fetchLoras().then(loras => { if (loras && loras.length > 0) setAvailableLoras(loras); });
      },
      handleWSMessage,
      () => { setConnectionStatus('disconnected'); setIsGenerating(false); },
      () => { setConnectionStatus('disconnected'); setIsGenerating(false); }
    );
  }, [comfyUrl, isDemoMode, handleWSMessage]);

  const refreshDetectedState = (wf: ComfyWorkflow) => {
    const fields: DetectedField[] = [];
    const models: DetectedModel[] = [];
    const loras: DetectedLora[] = [];
    const KNOWN_DYNAMIC_TYPES = ["RandomPrompt", "DynamicPrompt", "RandomGenerator", "DynamicPromptEvents"];
    
    Object.entries(wf).forEach(([nodeId, node]) => {
      const inputs = node.inputs || {};
      const classType = node.class_type;
      const title = (node._meta?.title || classType).toLowerCase();
      const hasSeed = 'seed' in inputs || 'noise_seed' in inputs;
      const isExplicitDynamic = KNOWN_DYNAMIC_TYPES.includes(classType);

      const textKeys = Object.keys(inputs).filter(k => TEXT_FIELD_CANDIDATES.includes(k.toLowerCase()) && typeof inputs[k] === 'string');

      if (textKeys.length > 0) {
          textKeys.forEach(textKey => {
              const valueStr = String(inputs[textKey]).toLowerCase();
              const keyName = textKey.toLowerCase();
              let subType: 'positive' | 'negative' | 'general' | 'dynamic' = 'general';

              if (keyName === 'positive' || keyName === 'text_positive' || keyName === 'text_g') subType = 'positive';
              else if (keyName === 'negative' || keyName === 'text_negative' || keyName === 'text_l') subType = 'negative';
              else if (isExplicitDynamic) subType = 'dynamic';
              else {
                  let isNeg = false, isPos = false;
                  if (title.includes('negative') || title.includes('负面') || title.includes('uc')) isNeg = true;
                  if (title.includes('positive') || title.includes('正面')) isPos = true;
                  if (!isNeg && !isPos) {
                      if (valueStr.includes('low quality') || valueStr.includes('bad hands') || valueStr.includes('embedding:')) isNeg = true;
                  }
                  if (isNeg) subType = 'negative'; else if (isPos) subType = 'positive'; else if (hasSeed) subType = 'dynamic'; else if (title.includes('prompt') || title.includes('clip')) subType = 'positive';
              }
              let label = node._meta?.title || classType;
              if (textKeys.length > 1) {
                  if (subType === 'positive') label = `${label} (正向)`;
                  else if (subType === 'negative') label = `${label} (负面)`;
                  else label = `${label} (${textKey})`;
              } else {
                   if (subType === 'dynamic') label = '动态提示词';
              }
              fields.push({ nodeId, field: textKey, type: 'prompt', subType, label: label, value: inputs[textKey] });
          });
      }

      if (SAMPLER_NODE_TYPES.includes(classType)) {
         NUMBER_FIELDS.forEach(conf => {
             if (conf.key in inputs && typeof inputs[conf.key] === 'number') {
                 fields.push({ nodeId, field: conf.key, type: 'number', label: conf.label, value: inputs[conf.key], min: conf.min, max: conf.max, step: conf.step });
             }
         });
      }
      if (MODEL_NODE_TYPES.CHECKPOINT.includes(classType) && inputs.ckpt_name) {
          models.push({ nodeId, name: inputs.ckpt_name, type: 'checkpoint' });
      }
      if (MODEL_NODE_TYPES.LORA.includes(classType)) {
          if (inputs.lora_name) {
              loras.push({ nodeId, name: inputs.lora_name, strength_model: inputs.strength_model ?? 1.0, strength_clip: inputs.strength_clip ?? 1.0, isEnabled: true, isNew: false });
          }
      }
    });
    setDetectedFields(fields);
    setDetectedModels(models);
    setDetectedLoras(loras);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as ComfyWorkflow;
        setWorkflow(json); refreshDetectedState(json); setActiveTab('parameters'); triggerHaptic('success');
      } catch (err) { alert("无效的 JSON 工作流文件"); }
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    triggerHaptic('medium');
    if (!workflow) return;
    if (isGenerating) { queueRef.current = true; setQueueSize(prev => prev + 1); return; }
    
    let currentWorkflow = JSON.parse(JSON.stringify(workflow));
    
    if (autoSeed) {
        const newSeed = Math.floor(Math.random() * 10000000000000);
        setDetectedFields(prev => prev.map(f => SEED_KEYS.includes(f.field) ? { ...f, value: newSeed } : f));
        Object.values(currentWorkflow).forEach((node: any) => {
             SEED_KEYS.forEach(k => { if (node.inputs && k in node.inputs) node.inputs[k] = newSeed; });
        });
    }
    
    const uiLoras = detectedLoras; 
    Object.keys(currentWorkflow).forEach(nodeId => {
        const node = currentWorkflow[nodeId];
        if (MODEL_NODE_TYPES.LORA.includes(node.class_type)) {
            const stillExists = uiLoras.some(l => l.nodeId === nodeId);
            if (!stillExists && node.inputs) { node.inputs.strength_model = 0; node.inputs.strength_clip = 0; }
        }
    });

    uiLoras.filter(l => !l.isNew).forEach(lora => {
        const node = currentWorkflow[lora.nodeId];
        if (node && node.inputs) {
            node.inputs.lora_name = lora.name; node.inputs.strength_model = lora.strength_model; node.inputs.strength_clip = lora.strength_clip;
        }
    });

    const newLoras = uiLoras.filter(l => l.isNew);
    if (newLoras.length > 0) {
        const injectedWf = injectLorasIntoWorkflow(currentWorkflow, newLoras);
        if (injectedWf) currentWorkflow = injectedWf;
        else { alert("警告: 无法自动插入新 LoRA"); }
    }

    setActiveTab('generate');
    
    if (isDemoMode) { runMockGeneration(); return; }
    if (!serviceRef.current || connectionStatus !== 'connected') { alert("未连接到 ComfyUI"); return; }

    try {
      setIsGenerating(true);
      await serviceRef.current.queuePrompt(currentWorkflow);
    } catch (e) { 
        triggerHaptic('error');
        alert("发送任务失败。"); 
        setIsGenerating(false); 
    }
  };

  const injectLorasIntoWorkflow = (baseWorkflow: ComfyWorkflow, lorasToInject: DetectedLora[]) => {
      if (lorasToInject.length === 0) return baseWorkflow;
      const newWorkflow = JSON.parse(JSON.stringify(baseWorkflow)) as ComfyWorkflow;
      const checkpointNodeId = Object.keys(newWorkflow).find(key => MODEL_NODE_TYPES.CHECKPOINT.includes(newWorkflow[key].class_type));
      if (!checkpointNodeId) return null;

      let currentModelSource: [string, number] = [checkpointNodeId, 0];
      let currentClipSource: [string, number] = [checkpointNodeId, 1];

      lorasToInject.forEach((lora, index) => {
          const newId = `injected_lora_${Date.now()}_${index}`;
          newWorkflow[newId] = {
              class_type: "LoraLoader",
              inputs: { lora_name: lora.name, strength_model: lora.strength_model, strength_clip: lora.strength_clip, model: currentModelSource, clip: currentClipSource }
          };
          currentModelSource = [newId, 0]; currentClipSource = [newId, 1];
      });

      Object.keys(newWorkflow).forEach(nodeId => {
          if (nodeId.startsWith("injected_lora_")) return;
          const node = newWorkflow[nodeId];
          if (!node.inputs) return;
          Object.keys(node.inputs).forEach(inputKey => {
              const val = node.inputs[inputKey];
              if (Array.isArray(val) && val.length === 2 && val[0] === checkpointNodeId) {
                  if (val[1] === 0) node.inputs[inputKey] = currentModelSource;
                  if (val[1] === 1) node.inputs[inputKey] = currentClipSource;
              }
          });
      });
      return newWorkflow;
  };

  const runMockGeneration = () => {
    setIsGenerating(true); setProgress(0);
    const metadata = getMetadataSnapshot();
    let p = 0;
    const interval = setInterval(() => {
      p += 2; setProgress(Math.min(p, 99));
      if (p >= 100) {
        clearInterval(interval); setIsGenerating(false); setProgress(100); triggerHaptic('success');
        const mockImg: GeneratedImage = {
          id: crypto.randomUUID(), filename: `demo-${Date.now()}.png`, subfolder: '', type: 'output', url: `https://picsum.photos/1024/1792?random=${Date.now()}`, metadata: metadata
        };
        setCurrentImage(mockImg); setHistory(prev => [...prev, mockImg]);
        if (queueRef.current) { queueRef.current = false; setQueueSize(prev => Math.max(0, prev - 1)); setTimeout(() => handleGenerate(), 500); }
      }
    }, 50);
  };

  const handleInterrupt = async () => {
      triggerHaptic('medium'); queueRef.current = false; setQueueSize(0);
      if (isDemoMode) { setIsGenerating(false); setProgress(0); return; }
      if (serviceRef.current) await serviceRef.current.interrupt();
  };

  const handleHistorySelect = (img: GeneratedImage) => {
      triggerHaptic('light');
      setCurrentImage(img);
      if (img.metadata && workflow) {
             const newWorkflow = JSON.parse(JSON.stringify(workflow));
             img.metadata.fields?.forEach(f => {
                 const node = newWorkflow[f.nodeId]; if (node && node.inputs) node.inputs[f.field] = f.value;
             });
             setWorkflow(newWorkflow);
      }
      setActiveTab('generate');
  };
  
  const onTabChange = (tab: TabType) => { triggerHaptic('light'); setActiveTab(tab); setCurrentImage(null); }

  return (
    <>
      <AmbientBackground />
      <div className="relative flex flex-col h-[100dvh] bg-transparent text-slate-100 font-sans selection:bg-purple-500/30 overflow-hidden z-10">
        {/* REMOVED 'pt-safe' here to allow immersive headers in children */}
        <div className={`flex-1 overflow-y-auto scrollbar-none ${activeTab === 'generate' ? 'pb-0' : 'pb-32'}`}>
          <main className="min-h-full h-full flex flex-col">
              {activeTab === 'parameters' && (
                  <ParametersView
                      comfyUrl={comfyUrl} setComfyUrl={setComfyUrl} isDemoMode={isDemoMode} setIsDemoMode={setIsDemoMode} connectionStatus={connectionStatus}
                      onConnect={connect} onFileUpload={handleFileUpload} detectedFields={detectedFields} detectedModels={detectedModels}
                      detectedLoras={detectedLoras} availableLoras={availableLoras} onFieldChange={updateField} onLoraChange={updateLora}
                      autoSeed={autoSeed} setAutoSeed={setAutoSeed} onAddLora={addLora} onRemoveLora={removeLora} onCopyTriggers={copyTriggerWords}
                  />
              )}
              {activeTab === 'generate' && (
                  <GenerateView
                      currentImage={currentImage} isGenerating={isGenerating} progress={progress} queueSize={queueSize}
                      onGenerate={handleGenerate} onInterrupt={handleInterrupt} isConnected={isDemoMode || connectionStatus === 'connected'} hasWorkflow={!!workflow}
                  />
              )}
              {activeTab === 'history' && (
                  <HistoryView history={history} onSelect={handleHistorySelect} onClear={handleClearHistory} onDelete={handleDeleteImage} />
              )}
          </main>
        </div>
        <Navigation activeTab={activeTab} onTabChange={onTabChange} isGenerating={isGenerating} queueSize={queueSize} />
      </div>
    </>
  );
};
export default App;