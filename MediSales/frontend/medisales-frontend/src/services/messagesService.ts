import api from './api';
import type { Message } from '../types/Message';

export const messagesService = {
  getMessages: async (userId: number) => {
    const { data } = await api.get<Message[]>(`/Messages/user/${userId}`);
    return data;
  },

  sendMessage: async (fromUserId: number, toUserId: number, messageText: string) => {
    const { data } = await api.post<Message>('/Messages', {
      fromUserId,
      toUserId,
      messageText,
      subject: 'New Message',
      body: messageText,
      senderId: fromUserId,
      recipientId: toUserId,
      priority: 'Normal',
    });
    return data;
  },

  markAsRead: async (messageId: number) => {
    const { data } = await api.put<Message>(`/Messages/${messageId}/read`);
    return data;
  },

  replyToMessage: async (messageId: number, replyText: string) => {
    const { data } = await api.put<Message>(`/Messages/${messageId}/reply`, { replyText });
    return data;
  },
};

export default messagesService;
