import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { errorToast, successToast, infoToast, warningToast } from '../utils/toast';
import signalRService from '../services/signalRService';

export interface Notification {
  id: number;
  type: 'stock-alert' | 'transaction' | 'message' | 'system';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success' | 'Low' | 'Critical';
  timestamp: Date;
  read: boolean;
  data?: any;
}

/**
 * Custom hook for managing real-time notifications via SignalR
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = async () => {
      try {
        await signalRService.startNotificationConnection();
        setIsConnected(signalRService.notificationConnectionState === signalR.HubConnectionState.Connected);
      } catch (error) {
        console.error('SignalR: Connection error:', error);
        setIsConnected(false);
      }
    };

    void connect();

    // Stock Alert Handler
    const handleStockAlert = (data: {
      ProductName: string;
      CurrentStock: number;
      AlertType: string;
      Timestamp: string;
    }) => {
      const notification: Notification = {
        id: Date.now(),
        type: 'stock-alert',
        message: `${data.ProductName} - ${data.CurrentStock} units left`,
        severity: data.AlertType === 'Critical' ? 'error' : 'warning',
        timestamp: new Date(data.Timestamp),
        read: false,
        data
      };

      setNotifications(prev => [notification, ...prev]);

      // Show toast notification
      if (data.AlertType === 'Critical') {
        errorToast(`Critical Stock Alert: ${data.ProductName} (${data.CurrentStock} left)`);
      } else {
        warningToast(`Low Stock: ${data.ProductName} (${data.CurrentStock} left)`);
      }
    };

    // Transaction Completed Handler
    const handleTransactionCompleted = (txnId: string, amount: number) => {
      const notification: Notification = {
        id: Date.now(),
        type: 'transaction',
        message: `Transaction ${txnId} completed: ₱${amount.toFixed(2)}`,
        severity: 'success',
        timestamp: new Date(),
        read: false,
        data: { txnId, amount }
      };

      setNotifications(prev => [notification, ...prev]);

      // Show success toast
      successToast(`Transaction ${txnId} completed: ₱${amount.toFixed(2)}`);
    };

    // New Message Received Handler
    const handleNewMessage = (data: {
      FromUserId: number;
      FromUserName: string;
      MessagePreview: string;
      Timestamp: string;
    }) => {
      const notification: Notification = {
        id: Date.now(),
        type: 'message',
        message: `New message from ${data.FromUserName}: ${data.MessagePreview}`,
        severity: 'info',
        timestamp: new Date(data.Timestamp),
        read: false,
        data
      };

      setNotifications(prev => [notification, ...prev]);

      // Show info toast
      infoToast(`New message from ${data.FromUserName}`);
    };

    // General Notification Handler
    const handleGeneralNotification = (message: string, type: string) => {
      const notification: Notification = {
        id: Date.now(),
        type: 'system',
        message,
        severity: (type as any) || 'info',
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);

      // Show toast based on type
      switch (type) {
        case 'success':
          successToast(message);
          break;
        case 'error':
          errorToast(message);
          break;
        case 'warning':
          warningToast(message);
          break;
        default:
          infoToast(message);
      }
    };

    signalRService.onReceiveStockAlert(handleStockAlert);
    signalRService.onTransactionCompleted(handleTransactionCompleted);
    signalRService.onNewMessageReceived(handleNewMessage);
    signalRService.onReceiveNotification(handleGeneralNotification);

    return () => {
      signalRService.offReceiveStockAlert(handleStockAlert);
      signalRService.offTransactionCompleted(handleTransactionCompleted);
      signalRService.offNewMessageReceived(handleNewMessage);
      signalRService.offReceiveNotification(handleGeneralNotification);
    };
  }, []); // Empty dependency array - connect once on mount

  /**
   * Mark a notification as read
   */
  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  /**
   * Clear a specific notification
   */
  const clearNotification = (notificationId: number) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    setNotifications([]);
  };

  /**
   * Get unread notification count
   */
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll
  };
};

export default useNotifications;
