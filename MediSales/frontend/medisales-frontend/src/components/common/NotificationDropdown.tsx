import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Package, DollarSign, MessageSquare, Info, AlertTriangle, X } from 'lucide-react';
import { useNotifications, type Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAll 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type'], severity: Notification['severity']) => {
    switch (type) {
      case 'stock-alert':
        return <Package className={`w-5 h-5 ${severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} />;
      case 'transaction':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        if (severity === 'error') return <AlertTriangle className="w-5 h-5 text-red-500" />;
        if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        if (severity === 'success') return <Check className="w-5 h-5 text-green-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: Notification['type'], severity: Notification['severity']) => {
    switch (type) {
      case 'stock-alert':
        return severity === 'error' ? 'bg-red-50' : 'bg-amber-50';
      case 'transaction':
        return 'bg-green-50';
      case 'message':
        return 'bg-blue-50';
      default:
        if (severity === 'error') return 'bg-red-50';
        if (severity === 'warning') return 'bg-amber-50';
        if (severity === 'success') return 'bg-green-50';
        return 'bg-blue-50';
    }
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-blue-50 transition-colors text-slate-600 hover:text-blue-600"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white text-blue-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'unread' 
                    ? 'bg-white text-blue-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs opacity-70">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 flex gap-3 transition-colors hover:bg-blue-50/50 group ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type, notification.severity)}`}>
                      {getIcon(notification.type, notification.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug mb-1 ${!notification.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
