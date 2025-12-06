import type { User } from './User';

export type MessagePriority = 'Low' | 'Normal' | 'High';

export interface Message {
  messageId: number;
  subject: string;
  body: string;
  senderId: number;
  recipientId: number;
  sentAt: string;
  isRead: boolean;
  priority: MessagePriority;
  replyToId?: number | null;
  respondedAt?: string | null;
  response?: string | null;
  sender?: User;
  recipient?: User;
}

export interface MessageThread {
  threadId: number;
  subject: string;
  messages: Message[];
}
