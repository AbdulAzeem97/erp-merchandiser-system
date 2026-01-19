import { io, Socket } from 'socket.io-client';
import { 
  PrepressJobUpdateEvent, 
  DesignerQueueUpdateEvent, 
  HODPrepressUpdateEvent, 
  NotificationEvent 
} from '../types/prepress';
import { DashboardKPIUpdateEvent } from '../types/reports';
import { getSocketUrl } from '../utils/apiConfig';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Use dynamic hostname detection for LAN support
      const serverUrl = getSocketUrl();
      
      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Connection error:', error);
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.socket?.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          reject(error);
        }
      });

      this.socket.on('error', (error) => {
        console.error('🔌 Socket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Prepress job events
  joinPrepressJob(jobId: string): void {
    this.socket?.emit('join_prepress_job', jobId);
  }

  leavePrepressJob(jobId: string): void {
    this.socket?.emit('leave_prepress_job', jobId);
  }

  onPrepressJobUpdate(callback: (event: PrepressJobUpdateEvent) => void): void {
    this.socket?.on('prepress_job_update', callback);
  }

  offPrepressJobUpdate(callback: (event: PrepressJobUpdateEvent) => void): void {
    this.socket?.off('prepress_job_update', callback);
  }

  // Designer queue events
  onDesignerQueueUpdate(callback: (event: DesignerQueueUpdateEvent) => void): void {
    this.socket?.on('designer_queue_update', callback);
  }

  offDesignerQueueUpdate(callback: (event: DesignerQueueUpdateEvent) => void): void {
    this.socket?.off('designer_queue_update', callback);
  }

  // HOD prepress events
  onHODPrepressUpdate(callback: (event: HODPrepressUpdateEvent) => void): void {
    this.socket?.on('hod_prepress_update', callback);
  }

  offHODPrepressUpdate(callback: (event: HODPrepressUpdateEvent) => void): void {
    this.socket?.off('hod_prepress_update', callback);
  }

  // Dashboard KPI events
  onDashboardKPIUpdate(callback: (event: DashboardKPIUpdateEvent) => void): void {
    this.socket?.on('dashboard_kpi_update', callback);
  }

  offDashboardKPIUpdate(callback: (event: DashboardKPIUpdateEvent) => void): void {
    this.socket?.off('dashboard_kpi_update', callback);
  }

  // Notification events
  onNotification(callback: (event: NotificationEvent) => void): void {
    this.socket?.on('notification', callback);
  }

  offNotification(callback: (event: NotificationEvent) => void): void {
    this.socket?.off('notification', callback);
  }

  // Role-specific events
  onRoleUpdate(callback: (event: any) => void): void {
    this.socket?.on('role_update', callback);
  }

  offRoleUpdate(callback: (event: any) => void): void {
    this.socket?.off('role_update', callback);
  }

  // System-wide events
  onSystemUpdate(callback: (event: any) => void): void {
    this.socket?.on('system_update', callback);
  }

  offSystemUpdate(callback: (event: any) => void): void {
    this.socket?.off('system_update', callback);
  }

  // Generic event handlers
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  // Connection status
  getConnectionStatus(): {
    connected: boolean;
    id?: string;
    transport?: string;
  } {
    if (!this.socket) {
      return { connected: false };
    }

    return {
      connected: this.socket.connected,
      id: this.socket.id,
      transport: this.socket.io.engine.transport.name
    };
  }

  // Reconnection management
  setReconnectAttempts(maxAttempts: number): void {
    this.maxReconnectAttempts = maxAttempts;
  }

  setReconnectDelay(delay: number): void {
    this.reconnectDelay = delay;
  }

  // Cleanup all listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;
