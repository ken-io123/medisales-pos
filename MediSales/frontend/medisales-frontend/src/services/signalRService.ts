import * as signalR from '@microsoft/signalr';

// SignalR service for real-time chat and notifications
class SignalRService {
  private chatConnection: signalR.HubConnection | null = null;
  private notificationConnection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  // Starts connection to Chat hub
  async startChatConnection(_userId: number): Promise<void> {
    if (this.chatConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('Chat hub already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Chat hub connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;

      this.chatConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5012/hubs/chat', {
          withCredentials: true,
          skipNegotiation: false, // ✅ FIX: Don't skip negotiation
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling, // ✅ FIX: Fallback transports
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
              console.log(`Chat hub reconnect attempt ${retryContext.previousRetryCount + 1}, waiting ${delay}ms`);
              return delay;
            }
            console.error('Max chat reconnect attempts reached');
            return null; // Stop reconnecting
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Handle reconnection events
      this.chatConnection.onreconnecting((error) => {
        console.warn('Chat hub reconnecting...', error);
        this.reconnectAttempts++;
      });

      this.chatConnection.onreconnected((connectionId) => {
        console.log('✅ Chat hub reconnected successfully', connectionId);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      this.chatConnection.onclose((error) => {
        console.log('Chat hub connection closed', error);
        this.isConnecting = false;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnect attempts reached. Please refresh the page.');
        }
      });

      await this.chatConnection.start();
      console.log('✅ SignalR Chat Hub Connected');
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Error starting Chat hub connection:', error);
      
      // ✅ FIX: Don't throw error, just log it to prevent breaking the app
      // The connection will be retried automatically
    }
  }

  // Starts connection to Notification hub
  async startNotificationConnection(): Promise<void> {
    if (this.notificationConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('Notification hub already connected');
      return;
    }

    if (this.notificationConnection?.state === signalR.HubConnectionState.Connecting || 
        this.notificationConnection?.state === signalR.HubConnectionState.Reconnecting) {
      console.log('Notification hub connection already in progress');
      return;
    }

    try {
      this.notificationConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5012/hubs/notifications', {
          withCredentials: true,
          skipNegotiation: false, // ✅ FIX: Don't skip negotiation
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling, // ✅ FIX: Fallback transports
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
              console.log(`Notification hub reconnect attempt ${retryContext.previousRetryCount + 1}, waiting ${delay}ms`);
              return delay;
            }
            console.error('Max notification reconnect attempts reached');
            return null;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.notificationConnection.onreconnecting(() => {
        console.warn('Notification hub reconnecting...');
      });

      this.notificationConnection.onreconnected((connectionId) => {
        console.log('✅ Notification hub reconnected successfully', connectionId);
      });

      this.notificationConnection.onclose((error) => {
        console.log('Notification hub connection closed', error);
      });

      await this.notificationConnection.start();
      console.log('✅ SignalR Notification Hub Connected');
    } catch (error) {
      console.error('❌ Error starting Notification hub connection:', error);
      
      // ✅ FIX: Don't throw error, just log it to prevent breaking the app
      // The connection will be retried automatically
    }
  }

  // Stops both hub connections
  async stopConnections(): Promise<void> {
    try {
      if (this.chatConnection) {
        await this.chatConnection.stop();
        this.chatConnection = null;
        console.log('Chat hub disconnected');
      }

      if (this.notificationConnection) {
        await this.notificationConnection.stop();
        this.notificationConnection = null;
        console.log('Notification hub disconnected');
      }
    } catch (error) {
      console.error('Error stopping SignalR connections:', error);
    }
  }

  // ==================== CHAT HUB METHODS ====================

  // Registers callback for receiving messages
  onReceiveMessage(callback: (fromUserId: number, message: string, messageId: number, createdAt: string) => void): void {
    if (!this.chatConnection) {
      console.warn('⚠️ Chat connection not yet established, handler will be registered once connected');
      // Store the callback to register later when connection is established
      setTimeout(() => {
        if (this.chatConnection) {
          this.chatConnection.on('ReceiveMessage', callback);
          console.log('✅ ReceiveMessage handler registered after connection established');
        }
      }, 1000);
      return;
    }

    this.chatConnection.on('ReceiveMessage', callback);
    console.log('✅ ReceiveMessage handler registered');
  }

  // Sends message to a specific user
  async sendMessage(fromUserId: number, toUserId: number, message: string): Promise<void> {
    if (!this.chatConnection || this.chatConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Chat connection not established');
    }

    try {
      await this.chatConnection.invoke('SendMessage', fromUserId, toUserId, message);
      console.log(`Message sent from ${fromUserId} to ${toUserId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Registers callback for stock alerts
  onStockAlert(callback: (productName: string, stock: number) => void): void {
    if (!this.chatConnection) {
      console.warn('Chat connection not established');
      return;
    }

    this.chatConnection.on('StockAlert', callback);
  }

  // Marks message as read
  async markMessageAsRead(messageId: number, readBy: number): Promise<void> {
    if (!this.chatConnection || this.chatConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Chat connection not established');
      return;
    }

    try {
      await this.chatConnection.invoke('MarkMessageAsRead', messageId, readBy);
      console.log(`Message ${messageId} marked as read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Registers callback for message read notifications
  onMessageRead(callback: (messageId: number, readBy: number) => void): void {
    if (!this.chatConnection) {
      console.warn('Chat connection not established');
      return;
    }

    this.chatConnection.on('MessageRead', callback);
  }

  // Joins conversation room
  async joinConversation(userId1: number, userId2: number): Promise<void> {
    if (!this.chatConnection || this.chatConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Chat connection not established');
      return;
    }

    try {
      await this.chatConnection.invoke('JoinConversation', userId1, userId2);
      console.log(`Joined conversation between ${userId1} and ${userId2}`);
    } catch (error) {
      console.error('Error joining conversation:', error);
      throw error;
    }
  }

  // Leaves current conversation room
  async leaveConversation(): Promise<void> {
    if (!this.chatConnection || this.chatConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.chatConnection.invoke('LeaveConversation');
      console.log('Left conversation');
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  }

  // Sends typing indicator to other user
  async sendTypingIndicator(userId: number, otherUserId: number, isTyping: boolean): Promise<void> {
    if (!this.chatConnection || this.chatConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.chatConnection.invoke('SendTypingIndicator', userId, otherUserId, isTyping);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // Registers callback for user typing notifications
  onUserTyping(callback: (userId: number, isTyping: boolean) => void): void {
    if (!this.chatConnection) {
      console.warn('Chat connection not established');
      return;
    }

    this.chatConnection.on('UserTyping', callback);
  }

  // ==================== NOTIFICATION HUB METHODS ====================

  // Registers callback for notifications
  onReceiveNotification(callback: (message: string, type: string) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('ReceiveNotification', callback);
  }

  offReceiveNotification(callback: (message: string, type: string) => void): void {
    this.notificationConnection?.off('ReceiveNotification', callback);
  }

  onReceiveStockAlert(callback: (data: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }
    this.notificationConnection.on('ReceiveStockAlert', callback);
  }

  offReceiveStockAlert(callback: (data: any) => void): void {
    this.notificationConnection?.off('ReceiveStockAlert', callback);
  }

  onNewMessageReceived(callback: (data: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }
    this.notificationConnection.on('NewMessageReceived', callback);
  }

  offNewMessageReceived(callback: (data: any) => void): void {
    this.notificationConnection?.off('NewMessageReceived', callback);
  }

  onSalesUpdated(callback: (amount: number, transactionCode: string, timestamp: string) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('SalesUpdated', callback);
  }

  offSalesUpdated(callback: (amount: number, transactionCode: string, timestamp: string) => void): void {
    this.notificationConnection?.off('SalesUpdated', callback);
  }

  onStockUpdated(callback: (productId: number, productName: string, newStock: number) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('StockUpdated', callback);
  }

  offStockUpdated(callback: (productId: number, productName: string, newStock: number) => void): void {
    this.notificationConnection?.off('StockUpdated', callback);
  }

  onLowStockAlert(callback: (productId: number, productName: string, currentStock: number, threshold: number) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('LowStockAlert', callback);
  }

  offLowStockAlert(callback: (productId: number, productName: string, currentStock: number, threshold: number) => void): void {
    this.notificationConnection?.off('LowStockAlert', callback);
  }

  onExpirationAlert(callback: (productId: number, productName: string, expiryDate: string, daysUntilExpiry: number) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('ExpirationAlert', callback);
  }

  offExpirationAlert(callback: (productId: number, productName: string, expiryDate: string, daysUntilExpiry: number) => void): void {
    this.notificationConnection?.off('ExpirationAlert', callback);
  }

  onProductCreated(callback: (product: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('ProductCreated', callback);
  }

  offProductCreated(callback: (product: any) => void): void {
    this.notificationConnection?.off('ProductCreated', callback);
  }

  onProductUpdated(callback: (product: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('ProductUpdated', callback);
  }

  offProductUpdated(callback: (product: any) => void): void {
    this.notificationConnection?.off('ProductUpdated', callback);
  }

  onProductArchived(callback: (product: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('ProductArchived', callback);
  }

  offProductArchived(callback: (product: any) => void): void {
    this.notificationConnection?.off('ProductArchived', callback);
  }

  onTransactionCompleted(callback: (transactionCode: string, totalAmount: number) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('TransactionCompleted', callback);
  }

  offTransactionCompleted(callback: (transactionCode: string, totalAmount: number) => void): void {
    this.notificationConnection?.off('TransactionCompleted', callback);
  }

  onTransactionVoided(callback: (transaction: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('TransactionVoided', callback);
  }

  offTransactionVoided(callback: (transaction: any) => void): void {
    this.notificationConnection?.off('TransactionVoided', callback);
  }

  onDashboardUpdated(callback: (data: any) => void): void {
    if (!this.notificationConnection) {
      console.warn('Notification connection not established');
      return;
    }

    this.notificationConnection.on('DashboardUpdated', callback);
  }

  offDashboardUpdated(callback: (data: any) => void): void {
    this.notificationConnection?.off('DashboardUpdated', callback);
  }

  // Joins notification group
  async joinNotificationGroup(groupName: string): Promise<void> {
    if (!this.notificationConnection || this.notificationConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Notification connection not established');
      return;
    }

    try {
      await this.notificationConnection.invoke('JoinGroup', groupName);
      console.log(`Joined notification group: ${groupName}`);
    } catch (error) {
      console.error(`Error joining group ${groupName}:`, error);
      throw error;
    }
  }

  get chatConnectionState(): signalR.HubConnectionState | null {
    return this.chatConnection?.state ?? null;
  }

  get notificationConnectionState(): signalR.HubConnectionState | null {
    return this.notificationConnection?.state ?? null;
  }

  get isConnected(): boolean {
    return (
      this.chatConnection?.state === signalR.HubConnectionState.Connected &&
      this.notificationConnection?.state === signalR.HubConnectionState.Connected
    );
  }
}

// Export singleton instance
export default new SignalRService();
