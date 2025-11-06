import React, { useEffect, useRef } from 'react';
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
} from '../features/conversationsSlice';
import {
  fetchMessages,
  fetchGroupMessages,
  addMessage,
  setCurrentChat,
  setTyping,
  updateMessageStatus,
  markMessageAsRead,
} from '../features/messagesSlice';
import { fetchOnlineUsers, updateOnlineUsers, setUserOnline, setUserOffline, fetchStatus } from '../features/statusSlice';
import { connectWebSocket, disconnectWebSocket, subscribeToGroup, subscribeToGroupTyping } from '../services/websocket';

const MessagingApp = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { selectedContact } = useSelector((state) => state.contacts);
  const { currentChat, messages } = useSelector((state) => state.messages);
  const { conversations } = useSelector((state) => state.conversations);
  const groupSubscriptionRef = useRef(null);
  const groupTypingSubscriptionRef = useRef(null);
  const groupTypingTimersRef = useRef({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (token && user?.username) {
      connectWebSocket(token, user.username, {
        onPrivateMessage: (message) => {
          dispatch(addMessage(message));
          dispatch(updateConversation(message));
          
          // Mark conversation as read if it's the current chat
          if (currentChat?.id === message.sender.id && currentChat?.type === 'PRIVATE') {
            dispatch(markConversationAsRead({ conversationId: message.sender.id, type: 'PRIVATE' }));
          }
        },
        onGroupMessage: (message) => {
          dispatch(addMessage(message));
          dispatch(updateConversation(message));
        },
        onReadReceipt: (readReceipt) => {
          // Update message status in real-time when read receipt is received via WebSocket
          console.log('Read receipt received:', readReceipt);
          dispatch(updateMessageStatus({ messageId: readReceipt.messageId, status: 'READ' }));
        },
        onTyping: (typingNotification) => {
          // Handle private typing: match by username against the active chat
          if (!typingNotification.groupId) {
            if (currentChat?.type === 'PRIVATE' && typingNotification.sender === selectedContact?.username) {
              dispatch(
                setTyping({
                  userId: selectedContact.id,
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
          // Map usernames to conversation userIds and update presence in real-time
          if (Array.isArray(onlineUsers) && conversations && conversations.length) {
            const offlineIds = [];
            conversations.forEach((conv) => {
              if (conv.type === 'PRIVATE') {
                if (onlineUsers.includes(conv.name)) {
                  dispatch(setUserOnline(conv.id));
                } else {
                  dispatch(setUserOffline(conv.id));
                  offlineIds.push(conv.id);
                }
              }
            });

            // Fetch last-seen for users that just became offline
            if (offlineIds.length > 0) {
              dispatch(fetchStatus(offlineIds));
            }
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
  }, [token, user, selectedContact, currentChat, dispatch]);

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
      const chatKey = currentChat.type === 'GROUP'
        ? `group_${currentChat.id}`
        : `private_${user.id}_${currentChat.id}`;
      
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

  return (
    <Box className="flex h-screen overflow-hidden">
      <Sidebar />
      <Box className="flex-1 flex flex-col">
        <ChatHeader selectedContact={selectedContact} />
        <ChatWindow selectedContact={selectedContact} />
        <MessageInput selectedContact={selectedContact} />
      </Box>
    </Box>
  );
};

export default MessagingApp;
