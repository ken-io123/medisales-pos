import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MoreVertical, Edit2, Trash2, Check, X, MessageCircle, Users, Phone, Video, Info } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import type { ChatMessage, Conversation } from '../../types/Chat';
import api from '../../services/api';
import { messageService } from '../../services/messageService';
import signalRService from '../../services/signalRService';
import profileService from '../../services/profileService';
import { successToast, errorToast } from '../../utils/toast';
import { format, isToday, isYesterday } from 'date-fns';

const MessengerPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const response = await api.get(`/Messages/conversations?userId=${user.userId}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!user?.userId) return;

    const setupSignalR = async () => {
      try {
        await signalRService.startChatConnection(user.userId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsConnected(true);

        signalRService.onReceiveMessage((fromUserId: number, messageText: string, messageId: number, sentDate: string) => {
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
          
          loadConversations();
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
  }, [user?.userId, loadConversations]);

  useEffect(() => {
    if (selectedConversation && user?.userId) {
      const loadMessages = async () => {
        try {
          const response = await api.get(`/Messages/conversation/${selectedConversation}?currentUserId=${user.userId}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      };
      
      loadMessages();
    }
  }, [selectedConversation, user?.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.userId) return;

    const trimmedMessage = newMessage.trim();
    const tempId = Date.now();
    
    const optimisticMessage: ChatMessage = {
      messageId: tempId,
      fromUserId: user.userId,
      toUserId: selectedConversation,
      messageText: trimmedMessage,
      sentDate: new Date().toISOString(),
      isRead: false
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      await messageService.sendMessage(selectedConversation, trimmedMessage, user.userId);
      loadConversations();
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

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserFullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.otherUserId === selectedConversation);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg m-4">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r-2 border-slate-100 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b-2 border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">MESSAGES</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Team Chat</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH PEOPLE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-slate-100">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.otherUserId}
                  onClick={() => setSelectedConversation(conv.otherUserId)}
                  className={`w-full p-4 flex items-start gap-3 transition-all hover:bg-slate-50 group relative ${
                    selectedConversation === conv.otherUserId ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {selectedConversation === conv.otherUserId && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}
                  <div className="relative">
                    <img 
                      src={profileService.getProfilePictureUrl(conv.otherUserProfilePictureUrl, conv.otherUserFullName)} 
                      alt={conv.otherUserFullName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md ring-1 ring-slate-100"
                    />
                    {/* Online indicator could go here if we had that data */}
                  </div>
                  <div className="flex-1 min-w-0 text-left pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-bold truncate ${selectedConversation === conv.otherUserId ? 'text-blue-900' : 'text-slate-900'}`}>
                        {conv.otherUserFullName}
                      </h3>
                      {conv.lastMessageTime && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                          {isToday(new Date(conv.lastMessageTime)) 
                            ? format(new Date(conv.lastMessageTime), 'h:mm a')
                            : format(new Date(conv.lastMessageTime), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                        {conv.lastMessageText || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white shadow-sm shadow-blue-500/30 animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-6 border-b-2 border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <img 
                  src={profileService.getProfilePictureUrl(selectedConv?.otherUserProfilePictureUrl, selectedConv?.otherUserFullName || '')} 
                  alt={selectedConv?.otherUserFullName}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md ring-2 ring-slate-100"
                />
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{selectedConv?.otherUserFullName}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active now
                  </p>
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
                  <p className="text-xs font-medium text-slate-500 mt-1">Say hello to start the conversation!</p>
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
                             src={profileService.getProfilePictureUrl(selectedConv?.otherUserProfilePictureUrl, selectedConv?.otherUserFullName || '')} 
                             alt={selectedConv?.otherUserFullName}
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
                  placeholder="Type a message..."
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border-2 border-slate-100 flex items-center justify-center mb-6 rotate-3 transition-transform hover:rotate-0">
              <MessageCircle className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">YOUR MESSAGES</h3>
            <p className="text-sm font-medium text-slate-500 max-w-xs text-center">
              Select a conversation from the sidebar to start chatting with your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerPage;