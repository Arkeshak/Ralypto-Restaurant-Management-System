export type WebSocketEventName =
  | 'order.created'
  | 'order.updated'
  | 'kitchen.ticket.status_changed'
  | 'table.status_changed'
  | 'waiter.called'
  | string;

export interface WebSocketEnvelope<T = any> {
  event: WebSocketEventName;
  timestamp: string;
  payload: T;
}

type WebSocketEventHandler<T = any> = (envelope: WebSocketEnvelope<T>) => void;
type ConnectionStatusListener = (connected: boolean) => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<WebSocketEventHandler>> = new Map();
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private reconnectTimer: number | null = null;
  private pollingTimer: number | null = null;
  private isConnected = false;
  private backoffIndex = 0;
  private readonly backoffDelays = [1000, 2000, 4000, 8000, 15000];

  get connected(): boolean {
    return this.isConnected;
  }

  onStatusChange(listener: ConnectionStatusListener) {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(connected: boolean) {
    this.isConnected = connected;
    this.statusListeners.forEach((listener) => listener(connected));
    if (connected) {
      this.stopFallbackPolling();
    } else {
      this.startFallbackPolling();
    }
  }

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
    const token =
      typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
        ? localStorage.getItem('ralypto_token')
        : null;

    // In mock mode without live backend, gracefully simulate connected mock socket
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
      this.notifyStatus(true);
      return;
    }

    try {
      this.socket = new WebSocket(`${wsUrl}?token=${token || ''}`);

      this.socket.onopen = () => {
        this.backoffIndex = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.notifyStatus(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const envelope: WebSocketEnvelope = JSON.parse(event.data);
          const { event: eventName } = envelope;

          if (eventName && this.listeners.has(eventName)) {
            this.listeners.get(eventName)!.forEach((handler) => handler(envelope));
          }

          // Wildcard listeners
          if (this.listeners.has('*')) {
            this.listeners.get('*')!.forEach((handler) => handler(envelope));
          }
        } catch {
          // Ignore unparseable raw frame
        }
      };

      this.socket.onclose = () => {
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = this.backoffDelays[this.backoffIndex] || 15000;
    this.backoffIndex = Math.min(this.backoffIndex + 1, this.backoffDelays.length - 1);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  // 10-second polling fallback when socket is disconnected
  private startFallbackPolling() {
    if (this.pollingTimer) return;

    this.pollingTimer = window.setInterval(async () => {
      // Dispatch tick event to notify views that polling cycle ran
      this.dispatchMockEvent('system.polling_tick', { polledAt: new Date().toISOString() });
    }, 10000);
  }

  private stopFallbackPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  on<T = any>(event: WebSocketEventName, handler: WebSocketEventHandler<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as WebSocketEventHandler);

    return () => {
      this.listeners.get(event)?.delete(handler as WebSocketEventHandler);
    };
  }

  emit(event: WebSocketEventName, payload: any) {
    const envelope: WebSocketEnvelope = {
      event,
      timestamp: new Date().toISOString(),
      payload,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(envelope));
    }
  }

  // Mock socket dispatch helper for dev mode & tests
  dispatchMockEvent<T = any>(event: WebSocketEventName, payload: T) {
    const envelope: WebSocketEnvelope<T> = {
      event,
      timestamp: new Date().toISOString(),
      payload,
    };

    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((handler) => handler(envelope));
    }
    if (this.listeners.has('*')) {
      this.listeners.get('*')!.forEach((handler) => handler(envelope));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopFallbackPolling();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus(false);
  }
}

export const socket = new SocketClient();
