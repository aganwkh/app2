
export const DEFAULT_COMFY_URL = "http://127.0.0.1:8188";

// Text field keys to scan for (lower case) - expanded for custom nodes
export const TEXT_FIELD_CANDIDATES = [
  'text', 'prompt', 'positive', 'negative', 
  'text_g', 'text_l', 'text_positive', 'text_negative',
  'string_field', 'wildcard_text', 'opt_text', 'value', 'string',
  'input_text', 'question', 'text_a', 'text_b'
];

export const PROMPT_NODE_TYPES = [
  "CLIPTextEncode",
  "CLIPTextEncodeSDXL",
  "ShowText",
  "Text Input",
  "RandomPrompt",
  "DynamicPrompt",
  "RandomGenerator",
  "DynamicPromptEvents",
  "WildcardPrompt",
  "DynamicPromptsRandom",
  "PrimitiveNode",
  "Efficient Loader",
  "Efficient Loader SDXL"
];

export const SAMPLER_NODE_TYPES = [
  "KSampler",
  "KSamplerAdvanced",
  "KSampler (Efficient)",
  "KSamplerProvider"
];

export const MODEL_NODE_TYPES = {
    CHECKPOINT: [
      "CheckpointLoaderSimple", 
      "CheckpointLoader", 
      "CheckpointLoader|pysssss",
      "Efficient Loader", 
      "Efficient Loader SDXL"
    ],
    LORA: [
        "LoraLoader", 
        "LoraLoaderModelOnly", 
        "LoraLoader|pysssss",
        "LoraLoaderStacker"
    ]
};

export const NUMBER_FIELDS = [
  { key: 'seed', label: '随机种子 (Seed)', min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
  { key: 'noise_seed', label: '随机种子 (Seed)', min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
  { key: 'steps', label: '迭代步数 (Steps)', min: 1, max: 100, step: 1 },
  { key: 'cfg', label: 'CFG 相关性', min: 0, max: 30, step: 0.1 },
  { key: 'denoise', label: '重绘幅度 (Denoise)', min: 0, max: 1, step: 0.01 },
  { key: 'sampler_name', label: '采样器', type: 'enum' }, 
  { key: 'scheduler', label: '调度器', type: 'enum' }
];

export const SEED_KEYS = ["seed", "noise_seed"];

export const CLIENT_ID = crypto.randomUUID();
