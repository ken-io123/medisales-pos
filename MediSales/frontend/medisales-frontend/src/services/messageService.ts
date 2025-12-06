import api from './api';
import type { Message } from '../types/Message';
import { successToast } from '../utils/toast';

const getAdminUserId = () => {
  const fallback = 1;
  const configured = Number(import.meta.env.VITE_ADMIN_USER_ID ?? fallback);
  return Number.isFinite(configured) && configured > 0 ? configured : fallback;
};

export const messageService = {
  getMessages: async () => {
    const { data } = await api.get<Message[]>('/Messages');
    return data;
  },

  getMessagesForUser: async (userId: number) => {
    const { data } = await api.get<Message[]>(`/Messages/user/${userId}`);
    return data;
  },

  sendMessage: async (toUserId: number, messageText: string, fromUserId: number = 1) => {
    const { data } = await api.post<Message>('/Messages', { 
      fromUserId,
      toUserId, 
      messageText 
    });
    successToast('Message sent successfully!');
    return data;
  },

  sendReply: async (messageId: number, replyText: string) => {
    await api.put(`/Messages/${messageId}/reply`, { replyText });
    successToast('Reply sent successfully!');
  },

  sendMessageToAdmin: async (messageText: string, fromUserId: number = 1) => {
    const toUserId = getAdminUserId();
    const { data } = await api.post<Message>('/Messages', {
      fromUserId,
      toUserId,
      messageText,
    });
    successToast('Message sent to admin successfully!');
    return data;
  },

  markAsRead: async (messageId: number) => {
    await api.put(`/Messages/${messageId}/read`);
    successToast('Message marked as read.');
  },

  archiveMessage: async (messageId: number) => {
    await api.post(`/Messages/${messageId}/archive`);
    successToast('Message archived successfully!');
  },

  updateMessage: async (messageId: number, messageText: string) => {
    const { data } = await api.put<Message>(`/Messages/${messageId}`, { messageText });
    successToast('Message updated successfully!');
    return data;
  },

  deleteMessage: async (messageId: number) => {
    await api.delete(`/Messages/${messageId}`);
    successToast('Message deleted successfully!');
  },
};
