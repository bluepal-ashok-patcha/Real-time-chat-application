import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let subscriptions = [];
// Keep desired subscriptions for auto re-subscribe on reconnect
let desiredSubscriptions = [];

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

      // Subscribe to typing notifications (user destination)
      if (callbacks.onTyping) {
        // Preferred: user destination without embedding username
        const subA = stompClient.subscribe(
          `/user/queue/typing`,
          (message) => {
            const typingNotification = JSON.parse(message.body);
            callbacks.onTyping(typingNotification);
          }
        );
        subscriptions.push(subA);

        // Fallback for setups that use username in the path
        const subB = stompClient.subscribe(
          `/user/${username}/queue/typing`,
          (message) => {
            const typingNotification = JSON.parse(message.body);
            callbacks.onTyping(typingNotification);
          }
        );
        subscriptions.push(subB);
      }

      // Subscribe to presence updates (public topic)
      if (callbacks.onOnlineUsersUpdate) {
        const subscription = stompClient.subscribe(`/topic/public`, (message) => {
          const chatMessage = JSON.parse(message.body);
          if (chatMessage.type === 'JOIN' || chatMessage.type === 'LEAVE') {
            const onlineUsers = (chatMessage.content || '').split(',').filter(Boolean);
            callbacks.onOnlineUsersUpdate(onlineUsers);
          }
        });
        subscriptions.push(subscription);
      }

      // Re-subscribe to any desired destinations (e.g., group and group typing) after reconnect
      if (desiredSubscriptions.length) {
        const newSubs = [];
        desiredSubscriptions.forEach((ds) => {
          const sub = stompClient.subscribe(ds.destination, (message) => {
            try {
              const payload = JSON.parse(message.body);
              ds.callback(payload);
            } catch (e) {
              // Fallback raw body
              ds.callback(message.body);
            }
          });
          newSubs.push(sub);
        });
        subscriptions.push(...newSubs);
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
    // Track desired subscription for auto (re)subscribe
    desiredSubscriptions.push({ destination: `/topic/${groupId}`, callback });
    return null;
  }

  const subscription = stompClient.subscribe(`/topic/${groupId}`, (message) => {
    const groupMessage = JSON.parse(message.body);
    callback(groupMessage);
  });

  subscriptions.push(subscription);
  desiredSubscriptions.push({ destination: `/topic/${groupId}`, callback });
  return subscription;
};

export const subscribeToGroupTyping = (groupId, callback) => {
  if (!stompClient || !stompClient.connected) {
    // Track desired subscription for auto (re)subscribe
    desiredSubscriptions.push({ destination: `/topic/${groupId}/typing`, callback });
    return null;
  }

  const subscription = stompClient.subscribe(`/topic/${groupId}/typing`, (message) => {
    const typingNotification = JSON.parse(message.body);
    callback(typingNotification);
  });

  subscriptions.push(subscription);
  desiredSubscriptions.push({ destination: `/topic/${groupId}/typing`, callback });
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
    desiredSubscriptions = [];
    stompClient.deactivate();
    stompClient = null;
  }
};

export const isConnected = () => {
  return stompClient && stompClient.connected;
};

