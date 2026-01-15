
import { CLIENT_ID } from '../constants';
import { ComfyWorkflow, GeneratedImage } from '../types';

export class ComfyService {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private clientId: string = CLIENT_ID;
  
  // Reconnection & Heartbeat state
  private isExplicitDisconnect: boolean = false;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 50; // Try for a long time
  private readonly RECONNECT_DELAY = 2000;

  // Stored callbacks for reconnection
  private savedCallbacks: {
    onOpen: () => void;
    onMessage: (event: MessageEvent) => void;
    onError: (err: Event) => void;
    onClose: () => void;
  } | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  getWsUrl(): string {
    try {
      const url = new URL(this.baseUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
      return `${protocol}//${url.host}${path}/ws?clientId=${this.clientId}`;
    } catch (e) {
      const protocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
      const host = this.baseUrl.replace(/^https?:\/\//, '');
      return `${protocol}://${host}/ws?clientId=${this.clientId}`;
    }
  }

  connect(
    onOpen: () => void,
    onMessage: (event: MessageEvent) => void,
    onError: (err: Event) => void,
    onClose: () => void
  ) {
    // Save callbacks for auto-reconnect
    this.savedCallbacks = { onOpen, onMessage, onError, onClose };
    this.isExplicitDisconnect = false;
    
    this.cleanup();

    try {
      this.ws = new WebSocket(this.getWsUrl());
      
      this.ws.onopen = () => {
        console.log("WebSocket Connected");
        this.retryCount = 0; // Reset retries on success
        this.startHeartbeat();
        onOpen();
      };

      this.ws.onmessage = onMessage;
      
      this.ws.onerror = (err) => {
        // Only trigger external error if we are not in a retry loop (to avoid spamming UI)
        if (this.retryCount === 0) onError(err);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        
        if (this.isExplicitDisconnect) {
          // User clicked disconnect
          console.log("WebSocket Disconnected explicitly");
          onClose();
        } else {
          // Connection dropped unexpectedly
          console.warn(`WebSocket Disconnected unexpectedly (Code: ${event.code}). Retrying...`);
          // Notify UI we are down (optional, UI might want to show "Reconnecting...")
          onClose(); 
          
          this.attemptReconnect();
        }
      };
    } catch (e) {
      console.error("WebSocket connection creation failed", e);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    // Exponential backoff or fixed delay? Fixed is usually better for this UX.
    this.reconnectTimeout = setTimeout(() => {
      if (this.savedCallbacks && !this.isExplicitDisconnect && this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`Attempting reconnect #${this.retryCount}...`);
        this.connect(
          this.savedCallbacks.onOpen,
          this.savedCallbacks.onMessage,
          this.savedCallbacks.onError,
          this.savedCallbacks.onClose
        );
      }
    }, this.RECONNECT_DELAY);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    // Send a "ping" every 30 seconds to keep the connection alive through proxies/routers
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // ComfyUI generally ignores unknown message types, acting as a ping
        this.ws.send(JSON.stringify({ type: 'c_ping', data: { time: Date.now() } }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = null;
  }

  private cleanup() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }

  disconnect() {
    this.isExplicitDisconnect = true;
    this.stopHeartbeat();
    this.cleanup();
  }

  async fetchLoras(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/object_info/LoraLoader`);
      if (!res.ok) throw new Error("Failed to fetch LoRA info");
      const data = await res.json();
      const loraNames = data?.LoraLoader?.input?.required?.lora_name?.[0];
      return Array.isArray(loraNames) ? loraNames : [];
    } catch (e) {
      // Quiet fail on fetch to avoid UI disruption
      return [];
    }
  }

  async queuePrompt(workflow: ComfyWorkflow): Promise<{ prompt_id: string; number: number; node_errors: any }> {
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        prompt: workflow,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to queue prompt: ${res.statusText}`);
    }
    return await res.json();
  }

  async interrupt(): Promise<void> {
    await fetch(`${this.baseUrl}/interrupt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
  }

  async getHistory(promptId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/history/${promptId}`);
    return await res.json();
  }

  getImageUrl(image: { filename: string; subfolder: string; type: string }): string {
    const params = new URLSearchParams({
      filename: image.filename,
      subfolder: image.subfolder,
      type: image.type,
    });
    return `${this.baseUrl}/view?${params.toString()}`;
  }
}
