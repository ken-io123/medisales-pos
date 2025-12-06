// Chat conversation and message types

export interface ChatMessage {
  messageId: number;
  fromUserId: number;
  toUserId: number;
  messageText: string;
  isRead: boolean;
  readAt?: string | null;
  sentDate: string;
  fromUsername?: string;
  fromStaffName?: string;
  toUsername?: string;
  toStaffName?: string;
  senderProfilePictureUrl?: string | null;
}

export interface Conversation {
  otherUserId: number;
  otherUsername: string;
  otherUserFullName: string;
  otherUserRole: string;
  otherUserProfilePictureUrl?: string | null;
  isOnline: boolean;
  lastSeenAt?: string | null;
  lastMessageText: string;
  lastMessageTime: string;
  isLastMessageFromMe: boolean;
  unreadCount: number;
}

export interface SendMessageDto {
  fromUserId: number;
  toUserId: number;
  messageText: string;
}
