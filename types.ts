
export interface ComfyNode {
  class_type: string;
  inputs: Record<string, any>;
  _meta?: {
    title?: string;
  };
}

export interface ComfyWorkflow {
  [nodeId: string]: ComfyNode;
}

export interface DetectedField {
  nodeId: string;
  field: string;
  value: string | number;
  label: string;
  type: 'prompt' | 'number';
  subType?: 'positive' | 'negative' | 'general' | 'dynamic'; // Added 'dynamic'
  min?: number;
  max?: number;
  step?: number;
}

export interface DetectedModel {
  nodeId: string;
  name: string;
  type: 'checkpoint' | 'lora';
}

export interface DetectedLora {
  nodeId: string;
  name: string;
  strength_model: number;
  strength_clip: number;
  isEnabled: boolean; // Virtual toggle
  isNew?: boolean; // Flag for injected nodes
}

export interface ExecutionStatus {
  isConnected: boolean;
  isGenerating: boolean;
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
  queueRemaining: number;
  error?: string;
}

export interface ImageMetadata {
  fields: DetectedField[];
  models: DetectedModel[];
  loras?: DetectedLora[]; // Added lora metadata
  timestamp: number;
}

export interface GeneratedImage {
  filename: string;
  subfolder: string;
  type: string;
  url: string;
  metadata?: ImageMetadata;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  data: any;
}
