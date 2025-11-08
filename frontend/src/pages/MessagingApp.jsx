import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import {
  fetchConversations,
  updateConversation,
  markConversationAsRead,
  setCurrentUserId as setConvCurrentUserId,
} from '../features/conversationsSlice';
import {
  fetchMessages,
  fetchGroupMessages,
  addMessage,
  addMessageWithKey,
  setCurrentChat,
  setTyping,
  updateMessageStatus,
  markMessageAsRead,
} from '../features/messagesSlice';
import { fetchOnlineUsers, updateOnlineUsers, setUserOnline, setUserOffline, fetchStatus } from '../features/statusSlice';
import { connectWebSocket, disconnectWebSocket, subscribeToGroup, subscribeToGroupTyping } from '../services/websocket';
import { initNotifications, setNotificationClickHandler, showMessageNotification } from '../services/notifications';
import api from '../services/api';

const MessagingApp = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { selectedContact } = useSelector((state) => state.contacts);
  const { currentChat, messages } = useSelector((state) => state.messages);
  const { conversations } = useSelector((state) => state.conversations);
  const { userStatus } = useSelector((state) => state.status);
  const groupSubscriptionRef = useRef(null);
  const groupTypingSubscriptionRef = useRef(null);
  const groupTypingTimersRef = useRef({});
  const currentChatRef = useRef(currentChat);
  const userRef = useRef(user);
  const selectedContactRef = useRef(selectedContact);
  const conversationsRef = useRef(conversations);
  const userStatusRef = useRef(userStatus);

  // Update refs whenever they change
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);
  
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    userStatusRef.current = userStatus;
  }, [userStatus]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize browser notifications and click behavior
    initNotifications();
    setNotificationClickHandler(async (data) => {
      try {
        if (data?.type === 'PRIVATE' && data?.userId && data?.username) {
          dispatch(setCurrentChat({ type: 'PRIVATE', id: data.userId }));
          // also update selected contact
          const { selectContact } = await import('../features/contactsSlice');
          dispatch(selectContact({ id: data.userId, username: data.username, profilePictureUrl: data.profilePictureUrl, type: 'PRIVATE' }));
        } else if (data?.type === 'GROUP' && data?.groupId) {
          // fetch group name then open
          try {
            const res = await api.get(`/groups/${data.groupId}`);
            const name = res.data?.name || 'Group';
            const imageUrl = res.data?.imageUrl || null;
            dispatch(setCurrentChat({ type: 'GROUP', id: data.groupId }));
            const { selectContact } = await import('../features/contactsSlice');
            dispatch(selectContact({ id: data.groupId, username: name, profilePictureUrl: imageUrl, type: 'GROUP' }));
          } catch (_) {}
        }
      } catch (_) {}
    });
  }, [dispatch]);

  // Handle tab close to properly disconnect WebSocket
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Disconnect WebSocket when tab is closing
      // Use synchronous disconnect to ensure it completes before page unloads
      try {
        disconnectWebSocket();
      } catch (e) {
        console.warn('Error disconnecting WebSocket on unload:', e);
      }
    };

    const handlePageHide = () => {
      // Also handle pagehide event (more reliable than beforeunload in some browsers)
      try {
        disconnectWebSocket();
      } catch (e) {
        console.warn('Error disconnecting WebSocket on page hide:', e);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (token && user?.username) {
      // Ensure conversations slice knows current user id for unread logic
      if (user?.id) {
        dispatch(setConvCurrentUserId(user.id));
      }
      connectWebSocket(token, user.username, {
        onPrivateMessage: (message) => {
          // Normalize private message to include missing receiver for consistent keys
          let normalized = message;
          try {
            if (!message.groupId) {
              const meId = userRef.current?.id;
              const meUsername = userRef.current?.username;
              const selected = selectedContactRef.current;
              const selectedUsername = selected?.username;

              // Ensure sender object
              if (!normalized.sender) {
                if (typeof message.sender === 'object' && message.sender?.id) {
                  // ok
                } else if (message.senderId) {
                  normalized = { ...normalized, sender: { id: message.senderId } };
                } else if (typeof message.sender === 'string' && selected && message.sender === selectedUsername) {
                  normalized = { ...normalized, sender: { id: selected.id } };
                }
              }

              // Ensure receiver object
              if (!normalized.receiver) {
                if (typeof message.receiver === 'object' && message.receiver?.id) {
                  // ok
                } else if (typeof message.receiver === 'string') {
                  if (meUsername && message.receiver === meUsername) {
                    normalized = { ...normalized, receiver: { id: meId } };
                  } else if (selected && message.receiver === selectedUsername) {
                    normalized = { ...normalized, receiver: { id: selected.id } };
                  }
                } else if (meId) {
                  // default to me for incoming
                  normalized = { ...normalized, receiver: { id: meId } };
                }
              }
            }
          } catch (_) {}
          // Compute a reliable chat key like groups do
          if (!normalized.groupId) {
            const meId = userRef.current?.id;
            const otherId = normalized.sender?.id === meId ? normalized.receiver?.id : normalized.sender?.id;
            const a = Math.min(meId || 0, otherId || 0);
            const b = Math.max(meId || 0, otherId || 0);
            const privateKey = `private_${a}_${b}`;
          dispatch(addMessageWithKey({ chatKey: privateKey, message: normalized }));

          // Show notification if message from other user and tab not focused or chat not open
          const fromOther = normalized.sender?.id && normalized.sender.id !== meId;
          const latestCurrentChat = currentChatRef.current;
          const notActiveChat = !(latestCurrentChat && latestCurrentChat.type === 'PRIVATE' && latestCurrentChat.id === (normalized.sender?.id === meId ? normalized.receiver?.id : normalized.sender?.id));
          if (fromOther && (document.visibilityState !== 'visible' || notActiveChat)) {
            showMessageNotification({
              title: normalized.sender?.username || 'New message',
              body: normalized.content,
              icon: normalized.sender?.profilePictureUrl || undefined,
              data: { type: 'PRIVATE', userId: normalized.sender?.id, username: normalized.sender?.username, profilePictureUrl: normalized.sender?.profilePictureUrl, tag: `p_${normalized.sender?.id}` },
            });
          }
          } else {
            dispatch(addMessage(normalized));
          }
          dispatch(updateConversation(normalized));
          
          // Mark conversation as read if it's the current chat
          // Use refs to get latest values without causing reconnection
          const latestCurrentChat = currentChatRef.current;
          const latestUser = userRef.current;
          const isCurrentChat = latestCurrentChat?.type === 'PRIVATE' && (
            (latestCurrentChat.id === message.sender?.id && latestUser?.id === message.receiver?.id) ||
            (latestCurrentChat.id === message.receiver?.id && latestUser?.id === message.sender?.id)
          );
          
          if (isCurrentChat) {
            const conversationId = latestCurrentChat.id;
            dispatch(markConversationAsRead({ conversationId, type: 'PRIVATE' }));
          }
        },
        onGroupMessage: (message) => {
          dispatch(addMessage(message));
          dispatch(updateConversation(message));
          // Show notification for group when not viewing that group
          const latestCurrentChat = currentChatRef.current;
          const notActiveChat = !(latestCurrentChat && latestCurrentChat.type === 'GROUP' && latestCurrentChat.id === message.groupId);
          if (document.visibilityState !== 'visible' || notActiveChat) {
            showMessageNotification({
              title: `New message in group`,
              body: message.content,
              data: { type: 'GROUP', groupId: message.groupId, tag: `g_${message.groupId}` },
            });
          }
        },
        onReadReceipt: (readReceipt) => {
          // Update message status in real-time when read receipt is received via WebSocket
          console.log('Read receipt received:', readReceipt);
          dispatch(updateMessageStatus({ messageId: readReceipt.messageId, status: 'READ' }));
        },
        onTyping: (typingNotification) => {
          // Handle private typing with latest refs (avoid stale closures)
          if (!typingNotification.groupId) {
            const latestCurrentChat = currentChatRef.current;
            const latestSelected = selectedContactRef.current;
            if (
              latestCurrentChat?.type === 'PRIVATE' &&
              typingNotification.sender === latestSelected?.username
            ) {
              dispatch(
                setTyping({
                  userId: latestSelected.id,
                  groupId: null,
                  username: typingNotification.sender,
                  typing: typingNotification.typing,
                })
              );
            }
          }
          // Group typing handled via dedicated subscription
        },
        onOnlineUsersUpdate: (onlineUsers) => {
          dispatch(updateOnlineUsers(onlineUsers));
          
          // Get latest values using refs to avoid stale closures
          const latestConversations = conversationsRef.current;
          const latestSelectedContact = selectedContactRef.current;
          const latestUserStatus = userStatusRef.current;
          
          // Map usernames to conversation userIds and update presence in real-time
          const offlineIds = [];
          const onlineIds = [];
          
          // Update status for all users in conversations
          if (Array.isArray(onlineUsers) && latestConversations && latestConversations.length) {
            latestConversations.forEach((conv) => {
              if (conv.type === 'PRIVATE') {
                if (onlineUsers.includes(conv.name)) {
                  dispatch(setUserOnline(conv.id));
                  onlineIds.push(conv.id);
                } else {
                  // Check if they were online before - if so, they just went offline
                  const currentStatus = latestUserStatus[conv.id];
                  if (currentStatus === 'online') {
                    // User just went offline, fetch last-seen immediately
                    dispatch(fetchStatus([conv.id]));
                  } else if (currentStatus !== 'online') {
                    dispatch(setUserOffline(conv.id));
                    offlineIds.push(conv.id);
                  }
                }
              }
            });
          }
          
          // Also update status for currently selected contact if it's a private chat
          if (latestSelectedContact && latestSelectedContact.type === 'PRIVATE' && latestSelectedContact.username) {
            const isSelectedContactOnline = onlineUsers.includes(latestSelectedContact.username);
            if (isSelectedContactOnline) {
              dispatch(setUserOnline(latestSelectedContact.id));
              if (!onlineIds.includes(latestSelectedContact.id)) {
                onlineIds.push(latestSelectedContact.id);
              }
            } else {
              // Check if they were online before - if so, fetch last-seen immediately
              const currentStatus = latestUserStatus[latestSelectedContact.id];
              if (currentStatus === 'online') {
                // User just went offline, fetch last-seen immediately
                dispatch(fetchStatus([latestSelectedContact.id]));
              } else if (currentStatus !== 'online' && !offlineIds.includes(latestSelectedContact.id)) {
                offlineIds.push(latestSelectedContact.id);
              }
            }
          }
          
          // Fetch last-seen for users that just became offline (batch request)
          if (offlineIds.length > 0) {
            dispatch(fetchStatus(offlineIds));
          }
        },
      });

      // Fetch online users
      dispatch(fetchOnlineUsers());

      return () => {
        if (groupSubscriptionRef.current) {
          groupSubscriptionRef.current.unsubscribe();
        }
        disconnectWebSocket();
      };
    }
  }, [token, user?.username, user?.id, dispatch]); // Remove currentChat and selectedContact from dependencies to prevent reconnection

  // Subscribe to group when group chat is selected
  useEffect(() => {
    if (currentChat?.type === 'GROUP' && currentChat?.id) {
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current.unsubscribe();
      }

      groupSubscriptionRef.current = subscribeToGroup(currentChat.id, (message) => {
        dispatch(addMessage(message));
        dispatch(updateConversation(message));
      });

      if (groupTypingSubscriptionRef.current) {
        groupTypingSubscriptionRef.current.unsubscribe();
      }

      groupTypingSubscriptionRef.current = subscribeToGroupTyping(currentChat.id, (typingNotification) => {
        // Ignore own typing events
        if (typingNotification.sender === user?.username) return;
        // Only update if the event belongs to the currently open group
        if (Number(typingNotification.groupId) !== Number(currentChat.id)) return;
        // Set typing true immediately
        dispatch(setTyping({
          userId: null,
          groupId: Number(typingNotification.groupId),
          username: typingNotification.sender,
          typing: typingNotification.typing,
        }));

        // Safety: clear typing after 4s if no stop event (typing=false) received
        const gid = Number(typingNotification.groupId);
        if (groupTypingTimersRef.current[gid]) {
          clearTimeout(groupTypingTimersRef.current[gid]);
        }
        if (typingNotification.typing) {
          groupTypingTimersRef.current[gid] = setTimeout(() => {
            dispatch(setTyping({ userId: null, groupId: gid, username: '', typing: false }));
            delete groupTypingTimersRef.current[gid];
          }, 4000);
        } else {
          // If a stop event arrives, clear any pending timer
          if (groupTypingTimersRef.current[gid]) {
            clearTimeout(groupTypingTimersRef.current[gid]);
            delete groupTypingTimersRef.current[gid];
          }
        }
      });
    }

    return () => {
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current.unsubscribe();
        groupSubscriptionRef.current = null;
      }
      if (groupTypingSubscriptionRef.current) {
        groupTypingSubscriptionRef.current.unsubscribe();
        groupTypingSubscriptionRef.current = null;
      }
    };
  }, [currentChat, dispatch]);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChat && user?.id) {
      if (currentChat.type === 'PRIVATE') {
        dispatch(fetchMessages({ userId1: user.id, userId2: currentChat.id }));
      } else if (currentChat.type === 'GROUP') {
        dispatch(fetchGroupMessages({ groupId: currentChat.id }));
      }
    }
  }, [currentChat, user, dispatch]);

  // Mark messages as read when viewing chat (real-time)
  useEffect(() => {
    if (selectedContact && currentChat && user?.id) {
      let chatKey;
      if (currentChat.type === 'GROUP') {
        chatKey = `group_${currentChat.id}`;
      } else {
        // Normalize chatKey for private messages to ensure consistent key regardless of user order
        const userIds = [user.id, currentChat.id].filter(Boolean).sort((a, b) => a - b);
        chatKey = `private_${userIds[0]}_${userIds[1]}`;
      }
      
      const chatMessages = messages[chatKey] || [];
      
      // Mark all unread messages as read
      chatMessages.forEach((msg) => {
        if (msg.status === 'DELIVERED') {
          if (currentChat.type === 'PRIVATE' && msg.receiver?.id === user.id) {
            // For private messages, mark as read if user is receiver
            dispatch(markMessageAsRead(msg.id));
          } else if (currentChat.type === 'GROUP') {
            // For group messages, mark as read for current user
            dispatch(markMessageAsRead(msg.id));
          }
        }
      });
      
      // Mark conversation as read in conversations list
      const conversation = conversations.find(
        (c) => c.id === selectedContact.id && c.type === (selectedContact.type === 'GROUP' ? 'GROUP' : 'PRIVATE')
      );
      
      if (conversation && conversation.unreadCount > 0) {
        dispatch(markConversationAsRead({ conversationId: selectedContact.id, type: selectedContact.type === 'GROUP' ? 'GROUP' : 'PRIVATE' }));
      }
    }
  }, [selectedContact, currentChat, user, conversations, messages, dispatch]);

  // Refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchConversations());
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  if (!user || !user.id) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  const [scrollToMessageId, setScrollToMessageId] = useState(null);

  const handleMessageSelect = (messageId) => {
    setScrollToMessageId(messageId);
    // Clear after a delay to allow re-scrolling if needed
    setTimeout(() => setScrollToMessageId(null), 2000);
  };

  return (
    <Box className="flex h-screen overflow-hidden">
      <Sidebar />
      <Box className="flex-1 flex flex-col">
        <ChatHeader selectedContact={selectedContact} onMessageSelect={handleMessageSelect} />
        <ChatWindow selectedContact={selectedContact} scrollToMessageId={scrollToMessageId} />
        <MessageInput selectedContact={selectedContact} />
      </Box>
    </Box>
  );
};

export default MessagingApp;
