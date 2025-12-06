import { useEffect, useState } from 'react';
import { Send, Inbox, SendHorizontal, Search, PenSquare, Reply, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { messagesService } from '../../services/messagesService';
import type { Message } from '../../types/Message';
import { errorToast, successToast } from '../../utils/toast';
import { PH_LOCALE, PH_TIME_ZONE, parseApiDate } from '../../utils/formatters';

const StaffMessages = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [viewMode, setViewMode] = useState<'list' | 'read' | 'compose'>('list');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Compose form
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, activeTab]);

  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await messagesService.getMessages(user.userId);
      
      // Filter based on tab
      const filtered = activeTab === 'inbox' 
        ? data.filter((m: Message) => m.recipientId === user.userId)
        : data.filter((m: Message) => m.senderId === user.userId);
      
      // Sort by date desc
      filtered.sort((a: Message, b: Message) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      
      setMessages(filtered);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !recipient || !messageText) {
      errorToast('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await messagesService.sendMessage(user.userId, parseInt(recipient), messageText);
      successToast('Message sent successfully!');
      setRecipient('');
      setSubject('');
      setMessageText('');
      setActiveTab('sent');
      setViewMode('list');
      fetchMessages();
    } catch (error) {
      errorToast('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await messagesService.markAsRead(messageId);
      // Update local state
      setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, isRead: true } : m));
      if (selectedMessage?.messageId === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, isRead: true } : null);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setViewMode('read');
    if (activeTab === 'inbox' && !message.isRead) {
      handleMarkAsRead(message.messageId);
    }
  };

  const handleCompose = () => {
    setSelectedMessage(null);
    setViewMode('compose');
    setRecipient('');
    setSubject('');
    setMessageText('');
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    const sender = activeTab === 'inbox' ? selectedMessage.senderId : selectedMessage.recipientId;
    setRecipient(sender.toString());
    setSubject(`Re: ${selectedMessage.subject || 'Message'}`);
    setMessageText(`\n\n-------------------\nOn ${new Date(selectedMessage.sentAt).toLocaleString(PH_LOCALE, { timeZone: PH_TIME_ZONE })}, User wrote:\n${selectedMessage.body}`);
    setViewMode('compose');
  };

  const filteredMessages = messages.filter((msg) => 
    (msg.body || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.sender?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.recipient?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg m-4">
      {/* Sidebar (Message List) */}
      <div className="w-80 bg-white border-r-2 border-slate-100 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b-2 border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">MAILBOX</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Internal Messages</p>
              </div>
            </div>
            <button 
              onClick={handleCompose}
              className="p-2.5 bg-white border-2 border-blue-100 text-blue-600 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all shadow-sm"
              title="Compose New Message"
            >
              <PenSquare className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex p-1.5 bg-slate-100 rounded-xl mb-4 border border-slate-200">
            <button
              onClick={() => { setActiveTab('inbox'); setViewMode('list'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                activeTab === 'inbox' 
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Inbox
            </button>
            <button
              onClick={() => { setActiveTab('sent'); setViewMode('list'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                activeTab === 'sent' 
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <SendHorizontal className="w-4 h-4" />
              Sent
            </button>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH MESSAGES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-slate-100">
                <Inbox className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredMessages.map((msg) => (
                <button
                  key={msg.messageId}
                  onClick={() => handleSelectMessage(msg)}
                  className={`w-full p-4 text-left transition-all hover:bg-slate-50 group relative ${
                    selectedMessage?.messageId === msg.messageId ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {selectedMessage?.messageId === msg.messageId && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold truncate pr-2 ${!msg.isRead && activeTab === 'inbox' ? 'text-blue-900' : 'text-slate-900'}`}>
                      {activeTab === 'inbox' ? (msg.sender?.username || 'Unknown') : (msg.recipient?.username || 'Unknown')}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                      {parseApiDate(msg.sentAt).toLocaleDateString(PH_LOCALE, {
                        month: 'short',
                        day: 'numeric',
                        timeZone: PH_TIME_ZONE,
                      })}
                    </span>
                  </div>
                  <p className={`text-xs truncate mb-1 ${!msg.isRead && activeTab === 'inbox' ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
                    {msg.subject || '(No Subject)'}
                  </p>
                  <p className="text-xs text-slate-400 truncate font-medium">
                    {msg.body}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white flex flex-col relative">
        {viewMode === 'compose' ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">NEW MESSAGE</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Compose a new message</p>
              </div>
              <button 
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all uppercase tracking-wide"
              >
                Cancel
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Recipient ID</label>
                    <input
                      type="number"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="Enter user ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="Message subject"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Message</label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[300px] resize-none"
                      placeholder="Type your message..."
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t-2 border-slate-100">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-8 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 uppercase tracking-wide text-sm"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : selectedMessage ? (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            {/* Message Header */}
            <div className="px-8 py-6 border-b-2 border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{selectedMessage.subject || '(No Subject)'}</h1>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleReply}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border-2 border-transparent hover:border-blue-100 transition-all"
                    title="Reply"
                  >
                    <Reply className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border-2 border-transparent hover:border-rose-100 transition-all" title="Delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-blue-500/20">
                  {activeTab === 'inbox' 
                    ? (selectedMessage.sender?.username?.charAt(0).toUpperCase() || 'U')
                    : (selectedMessage.recipient?.username?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {activeTab === 'inbox' 
                      ? (selectedMessage.sender?.username || 'Unknown User')
                      : (selectedMessage.recipient?.username || 'Unknown User')}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
                    {parseApiDate(selectedMessage.sentAt).toLocaleString(PH_LOCALE, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: PH_TIME_ZONE,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap text-slate-600 leading-relaxed font-medium text-sm">
                    {selectedMessage.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border-2 border-slate-100 flex items-center justify-center mb-6 rotate-3 transition-transform hover:rotate-0">
              <Inbox className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">SELECT A MESSAGE</h3>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 max-w-xs text-center">
              Choose a message from the list to view details or start a new conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffMessages;
