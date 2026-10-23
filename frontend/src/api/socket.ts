type WebSocketEventHandler = (data: any) => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectTimer: number | null = null;
  private isConnected = false;

  get connected(): boolean {
    return this.isConnected;
  }

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
    const token = localStorage.getItem('ralypto_token');

    // In mock mode without live backend, gracefully simulate socket
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
      this.isConnected = true;
      return;
    }

    try {
      this.socket = new WebSocket(`${wsUrl}?token=${token || ''}`);

      this.socket.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;
          if (eventName && this.listeners.has(eventName)) {
            this.listeners.get(eventName)!.forEach((handler) => handler(data));
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 5000);
    }
  }

  on(event: string, handler: WebSocketEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const socket = new SocketClient();
