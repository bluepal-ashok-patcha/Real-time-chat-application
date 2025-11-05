import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let subscriptions = [];

export const connectWebSocket = (token, username, callbacks) => {
  if (stompClient && stompClient.connected) {
    return stompClient;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8084/ws'),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('WebSocket Connected');

      // Subscribe to private messages
      if (callbacks.onPrivateMessage) {
        const subscription = stompClient.subscribe(
          `/user/${username}/queue/reply`,
          (message) => {
            const receivedMessage = JSON.parse(message.body);
            callbacks.onPrivateMessage(receivedMessage);
          }
        );
        subscriptions.push(subscription);
      }

      // Subscribe to read receipts
      if (callbacks.onReadReceipt) {
        const subscription = stompClient.subscribe(
          `/user/${username}/queue/read`,
          (message) => {
            const readReceipt = JSON.parse(message.body);
            callbacks.onReadReceipt(readReceipt);
          }
        );
        subscriptions.push(subscription);
      }

      // Subscribe to typing notifications
      if (callbacks.onTyping) {
        const subscription = stompClient.subscribe(
          `/user/${username}/queue/typing`,
          (message) => {
            const typingNotification = JSON.parse(message.body);
            callbacks.onTyping(typingNotification);
          }
        );
        subscriptions.push(subscription);
      }

      // Subscribe to group messages
      if (callbacks.onGroupMessage) {
        const subscription = stompClient.subscribe(
          `/topic/public`,
          (message) => {
            const chatMessage = JSON.parse(message.body);
            if (chatMessage.type === 'JOIN' || chatMessage.type === 'LEAVE') {
              // Online users update
              if (callbacks.onOnlineUsersUpdate) {
                const onlineUsers = chatMessage.content.split(',').filter(Boolean);
                callbacks.onOnlineUsersUpdate(onlineUsers);
              }
            }
          }
        );
        subscriptions.push(subscription);
      }
    },
    onDisconnect: () => {
      console.log('WebSocket Disconnected');
      subscriptions = [];
    },
    onStompError: (frame) => {
      console.error('STOMP Error:', frame);
    },
  });

  stompClient.activate();
  return stompClient;
};

export const subscribeToGroup = (groupId, callback) => {
  if (!stompClient || !stompClient.connected) {
    return null;
  }

  const subscription = stompClient.subscribe(`/topic/${groupId}`, (message) => {
    const groupMessage = JSON.parse(message.body);
    callback(groupMessage);
  });

  subscriptions.push(subscription);
  return subscription;
};

export const subscribeToGroupTyping = (groupId, callback) => {
  if (!stompClient || !stompClient.connected) {
    return null;
  }

  const subscription = stompClient.subscribe(`/topic/${groupId}/typing`, (message) => {
    const typingNotification = JSON.parse(message.body);
    callback(typingNotification);
  });

  subscriptions.push(subscription);
  return subscription;
};

export const sendMessageViaWebSocket = (message) => {
  if (!stompClient || !stompClient.connected) {
    return false;
  }

  stompClient.publish({
    destination: '/app/chat.sendMessage',
    body: JSON.stringify(message),
  });

  return true;
};

export const sendTypingNotification = (typingNotification) => {
  if (!stompClient || !stompClient.connected) {
    return false;
  }

  stompClient.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify(typingNotification),
  });

  return true;
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    subscriptions.forEach((sub) => sub.unsubscribe());
    subscriptions = [];
    stompClient.deactivate();
    stompClient = null;
  }
};

export const isConnected = () => {
  return stompClient && stompClient.connected;
};

