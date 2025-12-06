import { useState, useEffect, useCallback } from 'react';
import signalRService from '../services/signalRService';

export interface ChatMessage {
  messageId: number;
  fromUserId: number;
  toUserId: number;
  messageText: string;
  sentDate: string;
  isRead: boolean;
  readDate?: string | null;
  fromUsername?: string;
  fromStaffName?: string;
}

export interface TypingUser {
  userId: number;
  isTyping: boolean;
}

/**
 * Custom hook for managing SignalR chat functionality
 * 
 * Features:
 * - Real-time message sending and receiving
 * - Typing indicators
 * - Read receipts
 * - Connection state management
 * - Message history
 * 
 * @param currentUserId - The ID of the current logged-in user
 * @param otherUserId - The ID of the user to chat with
 */
export const useSignalRChat = (currentUserId: number, otherUserId: number) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SignalR connection and handlers
  useEffect(() => {
    const connectAndSetupHandlers = async () => {
      try {
        // Check if already connected
        if (signalRService.isConnected) {
          setIsConnected(true);
        } else {
          // Connect if not already connected
          await signalRService.startChatConnection(currentUserId);
          setIsConnected(true);
        }

        // Join the conversation room
        await signalRService.joinConversation(currentUserId, otherUserId);

        // Set up message receiver
        signalRService.onReceiveMessage((fromUserId, message, messageId, createdAt) => {
          // Only add message if it's from the other user in this conversation
          if (fromUserId === otherUserId) {
            const newMessage: ChatMessage = {
              messageId,
              fromUserId,
              toUserId: currentUserId,
              messageText: message,
              sentDate: createdAt,
              isRead: false,
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        });

        // Set up typing indicator receiver
        signalRService.onUserTyping((userId, isTyping) => {
          if (userId === otherUserId) {
            setIsOtherUserTyping(isTyping);
            
            // Auto-clear typing indicator after 3 seconds
            if (isTyping) {
              setTimeout(() => setIsOtherUserTyping(false), 3000);
            }
          }
        });

        // Set up read receipt receiver
        signalRService.onMessageRead((messageId, readBy) => {
          if (readBy === otherUserId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.messageId === messageId ? { ...msg, isRead: true, readDate: new Date().toISOString() } : msg
              )
            );
          }
        });

        console.log('✅ SignalR chat handlers set up successfully');
      } catch (err) {
        console.error('❌ Failed to connect SignalR:', err);
        setError('Failed to connect to chat server');
        setIsConnected(false);
      }
    };

    connectAndSetupHandlers();

    // Cleanup on unmount
    return () => {
      signalRService.leaveConversation();
    };
  }, [currentUserId, otherUserId]);

  /**
   * Sends a message to the other user
   */
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) {
        return;
      }

      if (!isConnected) {
        setError('Not connected to chat server');
        return;
      }

      try {
        await signalRService.sendMessage(currentUserId, otherUserId, messageText);
        
        // Add message optimistically to UI
        const optimisticMessage: ChatMessage = {
          messageId: Date.now(), // Temporary ID
          fromUserId: currentUserId,
          toUserId: otherUserId,
          messageText,
          sentDate: new Date().toISOString(),
          isRead: false,
        };
        setMessages((prev) => [...prev, optimisticMessage]);
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      }
    },
    [currentUserId, otherUserId, isConnected]
  );

  /**
   * Sends typing indicator to the other user
   */
  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      if (!isConnected) return;

      try {
        await signalRService.sendTypingIndicator(currentUserId, otherUserId, isTyping);
      } catch (err) {
        console.error('Error sending typing indicator:', err);
      }
    },
    [currentUserId, otherUserId, isConnected]
  );

  /**
   * Marks a message as read
   */
  const markMessageAsRead = useCallback(
    async (messageId: number) => {
      if (!isConnected) return;

      try {
        await signalRService.markMessageAsRead(messageId, currentUserId);
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    },
    [currentUserId, isConnected]
  );

  return {
    messages,
    setMessages, // Allow external control of messages (e.g., loading from API)
    isConnected,
    isOtherUserTyping,
    error,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
  };
};

export default useSignalRChat;
