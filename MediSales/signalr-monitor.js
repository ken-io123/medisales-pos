
// Copy and paste this into your browser console to monitor real-time events

console.log('%c🚀 SignalR Monitor Started', 'color: #00ff00; font-size: 16px; font-weight: bold;');
console.log('%cThis script will log all SignalR events in real-time', 'color: #00aaff;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');

// Create a monitoring namespace
window.SignalRMonitor = {
  startTime: new Date(),
  events: [],
  connections: [],
  
  log(type, message, data = null) {
    const timestamp = new Date();
    const elapsed = (timestamp - this.startTime) / 1000;
    
    const event = {
      type,
      message,
      data,
      timestamp,
      elapsed: `${elapsed.toFixed(2)}s`
    };
    
    this.events.push(event);
    
    // Color coding based on type
    const colors = {
      'connection': '#00ff00',
      'message': '#00aaff',
      'error': '#ff0000',
      'dashboard': '#ffaa00',
      'notification': '#ff00ff',
      'info': '#999999'
    };
    
    const color = colors[type] || '#ffffff';
    
    console.log(
      `%c[${event.elapsed}] %c${type.toUpperCase()} %c${message}`,
      'color: #666;',
      `color: ${color}; font-weight: bold;`,
      'color: #fff;',
      data || ''
    );
  },
  
  getStats() {
    return {
      totalEvents: this.events.length,
      connections: this.events.filter(e => e.type === 'connection').length,
      messages: this.events.filter(e => e.type === 'message').length,
      errors: this.events.filter(e => e.type === 'error').length,
      dashboardUpdates: this.events.filter(e => e.type === 'dashboard').length,
      notifications: this.events.filter(e => e.type === 'notification').length
    };
  },
  
  printSummary() {
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
    console.log('%c📊 SignalR Session Summary', 'color: #00ff00; font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
    
    const stats = this.getStats();
    const duration = (new Date() - this.startTime) / 1000;
    
    console.log(`%c⏱️  Session Duration: ${duration.toFixed(2)}s`, 'color: #00aaff;');
    console.log(`%c📡 Total Events: ${stats.totalEvents}`, 'color: #fff;');
    console.log(`%c🔌 Connections: ${stats.connections}`, 'color: #00ff00;');
    console.log(`%c💬 Messages: ${stats.messages}`, 'color: #00aaff;');
    console.log(`%c📊 Dashboard Updates: ${stats.dashboardUpdates}`, 'color: #ffaa00;');
    console.log(`%c🔔 Notifications: ${stats.notifications}`, 'color: #ff00ff;');
    console.log(`%c❌ Errors: ${stats.errors}`, 'color: #ff0000;');
    
    if (stats.errors > 0) {
      console.log('%c⚠️  Errors detected! Review logs above.', 'color: #ff0000; font-weight: bold;');
    } else {
      console.log('%c✅ No errors detected!', 'color: #00ff00; font-weight: bold;');
    }
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  },
  
  clear() {
    this.events = [];
    this.startTime = new Date();
    console.clear();
    console.log('%c🔄 Monitor cleared and reset', 'color: #ffaa00; font-weight: bold;');
  }
};

// Hook into common SignalR events
console.log('%c📡 Hooking into SignalR events...', 'color: #00aaff;');

// Monitor WebSocket connections
const OriginalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  window.SignalRMonitor.log('connection', 'WebSocket connecting...', { url });
  
  const ws = new OriginalWebSocket(url, protocols);
  
  ws.addEventListener('open', () => {
    window.SignalRMonitor.log('connection', '✅ WebSocket connected', { url });
  });
  
  ws.addEventListener('close', (event) => {
    window.SignalRMonitor.log('connection', '❌ WebSocket closed', { 
      code: event.code, 
      reason: event.reason 
    });
  });
  
  ws.addEventListener('error', (error) => {
    window.SignalRMonitor.log('error', '❌ WebSocket error', error);
  });
  
  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Detect event type from SignalR message
      if (data.type === 1) { // Invocation
        const target = data.target;
        if (target === 'DashboardUpdated') {
          window.SignalRMonitor.log('dashboard', '📊 Dashboard update received', data.arguments[0]);
        } else if (target === 'ReceiveMessage') {
          window.SignalRMonitor.log('message', '💬 Message received', {
            from: data.arguments[0],
            content: data.arguments[1]?.substring(0, 50) + '...'
          });
        } else if (target === 'ReceiveNotification') {
          window.SignalRMonitor.log('notification', '🔔 Notification received', data.arguments[0]);
        } else {
          window.SignalRMonitor.log('info', `📨 SignalR event: ${target}`, data);
        }
      }
    } catch (e) {
      // Not JSON, ignore
    }
  });
  
  return ws;
};

// Monitor fetch/XHR for authentication
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  
  if (typeof url === 'string' && url.includes('/negotiate')) {
    window.SignalRMonitor.log('connection', '🤝 Negotiating SignalR connection...', { url });
  }
  
  return originalFetch.apply(this, args)
    .then(response => {
      if (typeof url === 'string' && url.includes('/negotiate')) {
        if (response.ok) {
          window.SignalRMonitor.log('connection', '✅ Negotiation successful');
        } else {
          window.SignalRMonitor.log('error', '❌ Negotiation failed', { status: response.status });
        }
      }
      return response;
    })
    .catch(error => {
      if (typeof url === 'string' && url.includes('hub')) {
        window.SignalRMonitor.log('error', '❌ Hub request failed', error);
      }
      throw error;
    });
};

console.log('%c✅ Monitor hooks installed', 'color: #00ff00;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
console.log('%c📝 Available Commands:', 'color: #ffaa00; font-weight: bold;');
console.log('%c  • SignalRMonitor.getStats() - Get statistics', 'color: #00aaff;');
console.log('%c  • SignalRMonitor.printSummary() - Print summary', 'color: #00aaff;');
console.log('%c  • SignalRMonitor.clear() - Clear logs', 'color: #00aaff;');
console.log('%c  • SignalRMonitor.events - View all events', 'color: #00aaff;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
console.log('%c👀 Monitoring active - all events will be logged below...', 'color: #fff;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
