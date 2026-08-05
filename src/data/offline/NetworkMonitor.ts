import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export class NetworkMonitor {
  private onlineState: boolean = true;
  private listeners: Set<() => void> = new Set();
  private subscription: NetInfoSubscription | null = null;

  constructor() {
    this.subscription = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      const wasOffline = !this.onlineState;
      this.onlineState = isConnected;

      if (wasOffline && isConnected) {
        this.notifyReconnectListeners();
      }
    });

    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      this.onlineState = Boolean(state.isConnected && state.isInternetReachable !== false);
    });
  }

  public isOnline(): boolean {
    return this.onlineState;
  }

  public onReconnect(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyReconnectListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[NetworkMonitor] Reconnect listener error:', err);
      }
    });
  }

  public dispose(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
  }
}
