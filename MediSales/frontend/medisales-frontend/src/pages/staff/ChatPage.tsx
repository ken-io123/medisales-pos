import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Check, X, MoreVertical, Edit2, Trash2, Phone, Video, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { ChatMessage } from '../../types/Chat';
import api from '../../services/api';
import { messageService } from '../../services/messageService';
import signalRService from '../../services/signalRService';
import profileService from '../../services/profileService';
import { successToast, errorToast } from '../../utils/toast';
import { format, isToday, isYesterday } from 'date-fns';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Admin ID is typically 1, or we could fetch it from config
  const ADMIN_USER_ID = 1;

  const loadMessages = async () => {
    if (!user?.userId) return;
    try {
      // Fetch conversation with Admin (User ID 1)
      const response = await api.get(`/Messages/conversation/${ADMIN_USER_ID}?currentUserId=${user.userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;

    const setupSignalR = async () => {
      try {
        await signalRService.startChatConnection(user.userId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsConnected(true);

        signalRService.onReceiveMessage((fromUserId: number, messageText: string, messageId: number, sentDate: string) => {
          // Only accept messages from Admin or self (echo)
          if (fromUserId !== ADMIN_USER_ID && fromUserId !== user.userId) return;

          const newMsg: ChatMessage = {
            messageId,
            fromUserId,
            toUserId: user.userId,
            messageText,
            sentDate,
            isRead: false
          };
          
          setMessages((prev) => {
            const withoutOptimistic = prev.filter(m => m.messageId < 1000000000000 || m.messageId > 9999999999999);
            const exists = withoutOptimistic.some(m => m.messageId === messageId);
            if (!exists) {
              return [...withoutOptimistic, newMsg].sort((a, b) => 
                new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime()
              );
            }
            return withoutOptimistic;
          });
          
          // Reload to ensure sync
          loadMessages();
        });
      } catch (error) {
        console.error('SignalR connection failed:', error);
        setIsConnected(false);
      }
    };

    setupSignalR();

    return () => {
      signalRService.stopConnections();
      setIsConnected(false);
    };
  }, [user?.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.userId) return;

    const trimmedMessage = newMessage.trim();
    const tempId = Date.now();
    
    const optimisticMessage: ChatMessage = {
      messageId: tempId,
      fromUserId: user.userId,
      toUserId: ADMIN_USER_ID,
      messageText: trimmedMessage,
      sentDate: new Date().toISOString(),
      isRead: false
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      await messageService.sendMessage(ADMIN_USER_ID, trimmedMessage, user.userId);
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      errorToast('Failed to send message');
      setMessages((prev) => prev.filter(m => m.messageId !== tempId));
      setNewMessage(trimmedMessage);
    }
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editingText.trim()) return;

    try {
      await messageService.updateMessage(messageId, editingText.trim());
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId ? { ...msg, messageText: editingText.trim() } : msg
        )
      );
      setEditingMessageId(null);
      setEditingText('');
      setActiveMenu(null);
      successToast('Message updated');
    } catch (error) {
      errorToast('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
      setActiveMenu(null);
      successToast('Message deleted');
    } catch (error) {
      errorToast('Failed to delete message');
    }
  };

  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message.messageId);
    setEditingText(message.messageText);
    setActiveMenu(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg m-4">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        {/* Chat Header */}
        <div className="h-20 px-6 border-b-2 border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={profileService.getProfilePictureUrl(null, 'Admin Support')} 
                alt="Admin Support"
                className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md ring-2 ring-slate-100"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Admin Support</h2>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                isConnected ? 'text-emerald-600' : 'text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isConnected ? 'Online' : 'Connecting...'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all border-2 border-transparent hover:border-slate-100">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all border-2 border-transparent hover:border-slate-100">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all border-2 border-transparent hover:border-slate-100">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border-2 border-slate-100">
                <MessageCircle className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">No messages yet</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Send a message to contact the administrator.</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.fromUserId === user?.userId;
              const showTime = index === 0 || 
                new Date(message.sentDate).getTime() - new Date(messages[index - 1].sentDate).getTime() > 300000; // 5 mins

              return (
                <div key={message.messageId} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {showTime && (
                    <div className="flex justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                        {formatMessageTime(message.sentDate)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group items-end gap-3`}>
                    {!isOwnMessage && (
                       <img 
                         src={profileService.getProfilePictureUrl(null, 'Admin Support')} 
                         alt="Admin Support"
                         className="w-8 h-8 rounded-xl object-cover border-2 border-white shadow-sm mb-1"
                       />
                    )}
                    <div className={`max-w-[70%] relative ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-5 py-3 shadow-sm text-sm font-medium leading-relaxed ${
                          isOwnMessage
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-blue-500/20'
                            : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm'
                        }`}
                      >
                        {editingMessageId === message.messageId ? (
                          <div className="space-y-2 min-w-[200px]">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={cancelEditing} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3" /></button>
                              <button onClick={() => handleEditMessage(message.messageId)} className="p-1 hover:bg-white/10 rounded"><Check className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.messageText}</p>
                        )}
                      </div>

                      {/* Message Actions */}
                      {isOwnMessage && !editingMessageId && (
                        <div className="absolute top-0 -left-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                          <button
                            onClick={() => setActiveMenu(activeMenu === message.messageId ? null : message.messageId)}
                            className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          {activeMenu === message.messageId && (
                            <div className="absolute top-10 right-0 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 overflow-hidden ring-1 ring-slate-900/5">
                              <button
                                onClick={() => startEditing(message)}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.messageId)}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isOwnMessage && (
                       <img 
                         src={profileService.getProfilePictureUrl(user?.profilePictureUrl, user?.fullName || '')} 
                         alt={user?.fullName}
                         className="w-8 h-8 rounded-xl object-cover border-2 border-white shadow-sm mb-1 order-3"
                       />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t-2 border-slate-100">
          <div className="flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message to admin..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 max-h-32 overflow-y-auto resize-none"
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
