import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import MessageBubble from './MessageBubble';
import { useSelector, useDispatch } from 'react-redux';
import { markMessageAsRead, fetchMessages, fetchGroupMessages } from '../features/messagesSlice';

const ChatWindow = ({ selectedContact }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const { messages: messagesState, currentChat, typing, pagination } = useSelector((state) => state.messages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatKey = () => {
    if (!currentChat) return null;
    if (currentChat.type === 'GROUP') {
      return `group_${currentChat.id}`;
    } else {
      const userIds = [user.id, currentChat.id].filter(Boolean).sort((a, b) => a - b);
      return `private_${userIds[0]}_${userIds[1]}`;
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore) return;
    
    const chatKey = getChatKey();
    if (!chatKey) return;
    
    const paginationInfo = pagination[chatKey];
    if (!paginationInfo || !paginationInfo.hasMore || paginationInfo.loading) return;
    
    // Load more when scrolled to top (within 100px)
    if (container.scrollTop < 100) {
      setIsLoadingMore(true);
      const nextPage = (paginationInfo.page || 0) + 1;
      const oldScrollHeight = container.scrollHeight;
      
      if (currentChat.type === 'GROUP') {
        dispatch(fetchGroupMessages({ groupId: currentChat.id, page: nextPage, size: 50 })).then(() => {
          // Restore scroll position after new messages are added
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - oldScrollHeight;
            setIsLoadingMore(false);
          }, 0);
        }).catch(() => {
          setIsLoadingMore(false);
        });
      } else {
        dispatch(fetchMessages({ userId1: user.id, userId2: currentChat.id, page: nextPage, size: 50 })).then(() => {
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - oldScrollHeight;
            setIsLoadingMore(false);
          }, 0);
        }).catch(() => {
          setIsLoadingMore(false);
        });
      }
    }
  };

  useEffect(() => {
    // Only auto-scroll to bottom on initial load or new messages (not when loading more)
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messagesState, currentChat]);

  // Mark messages as read when they become visible (for private chats)
  useEffect(() => {
    if (selectedContact?.type === 'PRIVATE' && user?.id && currentChat) {
      // Normalize chatKey for private messages to ensure consistent key regardless of user order
      const userIds = [user.id, currentChat.id].filter(Boolean).sort((a, b) => a - b);
      const chatKey = `private_${userIds[0]}_${userIds[1]}`;
      const chatMessages = messagesState[chatKey] || [];
      
      // Mark all unread messages as read when viewing
      chatMessages.forEach((msg) => {
        if (msg.status === 'DELIVERED' && msg.receiver?.id === user.id) {
          dispatch(markMessageAsRead(msg.id));
        }
      });
    }
  }, [selectedContact, user, currentChat, messagesState, dispatch]);

  const getChatMessages = () => {
    if (!currentChat) return [];
    
    let chatKey;
    if (currentChat.type === 'GROUP') {
      chatKey = `group_${currentChat.id}`;
    } else {
      // Normalize chatKey for private messages to ensure consistent key regardless of user order
      const userIds = [user.id, currentChat.id].filter(Boolean).sort((a, b) => a - b);
      chatKey = `private_${userIds[0]}_${userIds[1]}`;
    }
    
    return messagesState[chatKey] || [];
  };

  const chatMessages = getChatMessages();
  const typingKey = selectedContact?.type === 'GROUP'
    ? `group_${selectedContact.id}`
    : `user_${selectedContact?.id}`;
  const isTyping = typing[typingKey]?.typing;

  if (!selectedContact) {
    return (
      <Box className="flex-1 bg-[#efeae2] flex items-center justify-center">
        <Box className="text-center p-8">
          <Typography className="text-gray-500 text-lg mb-2">
            WhatsApp Web
          </Typography>
          <Typography className="text-gray-400 text-sm">
            Select a conversation to start chatting
          </Typography>
        </Box>
      </Box>
    );
  }

  const chatKey = getChatKey();
  const paginationInfo = chatKey ? pagination[chatKey] : null;

  return (
    <Box className="flex-1 bg-[#efeae2] flex flex-col overflow-hidden">
      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
        sx={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'100\' height=\'100\' patternTransform=\'scale(0.5) rotate(0)\'%3E%3Crect id=\'b\' width=\'100\' height=\'100\' fill=\'hsla(0,0%25,100%25,1)\'/%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23c)\'/%3E%3C/pattern%3E%3Cpattern id=\'c\' patternUnits=\'userSpaceOnUse\' width=\'100\' height=\'100\' patternTransform=\'scale(0.5) rotate(0)\'%3E%3Cpath d=\'M100 100V0h100v100z\' fill=\'hsla(0,0%25,100%25,0)\'/%3E%3Cpath d=\'M100 100V0m100 0v100z\' stroke=\'hsla(0,0%25,0%25,0.02)\' stroke-width=\'1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23a)\' width=\'100%25\' height=\'100%25\'/%3E%3C/svg%3E")' }}
      >
        {chatMessages.length === 0 ? (
          <Box className="flex items-center justify-center h-full">
            <Typography className="text-gray-400">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          <>
            {paginationInfo?.loading && (
              <Box className="flex justify-center py-2">
                <CircularProgress size={20} />
              </Box>
            )}
            {chatMessages.map((message) => (
              <Box key={message.id} data-message-id={message.id}>
                <MessageBubble message={message} />
              </Box>
            ))}
            {isTyping && (
              <Box className="flex justify-start mb-2">
                <Box className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <Typography className="text-gray-400 text-sm italic">
                    {typing[typingKey].username} is typing...
                  </Typography>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChatWindow;

