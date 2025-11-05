import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import MessageBubble from './MessageBubble';
import { useSelector, useDispatch } from 'react-redux';
import { markMessageAsRead } from '../features/messagesSlice';

const ChatWindow = ({ selectedContact }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const { messages: messagesState, currentChat, typing } = useSelector((state) => state.messages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesState, currentChat]);

  // Mark messages as read when they become visible (for private chats)
  useEffect(() => {
    if (selectedContact?.type === 'PRIVATE' && user?.id && currentChat) {
      const chatKey = `private_${user.id}_${currentChat.id}`;
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
    
    const chatKey = currentChat.type === 'GROUP'
      ? `group_${currentChat.id}`
      : `private_${user.id}_${currentChat.id}`;
    
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

  return (
    <Box className="flex-1 bg-[#efeae2] flex flex-col overflow-hidden">
      {/* Messages */}
      <Box className="flex-1 overflow-y-auto p-4" sx={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'100\' height=\'100\' patternTransform=\'scale(0.5) rotate(0)\'%3E%3Crect id=\'b\' width=\'100\' height=\'100\' fill=\'hsla(0,0%25,100%25,1)\'/%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23c)\'/%3E%3C/pattern%3E%3Cpattern id=\'c\' patternUnits=\'userSpaceOnUse\' width=\'100\' height=\'100\' patternTransform=\'scale(0.5) rotate(0)\'%3E%3Cpath d=\'M100 100V0h100v100z\' fill=\'hsla(0,0%25,100%25,0)\'/%3E%3Cpath d=\'M100 100V0m100 0v100z\' stroke=\'hsla(0,0%25,0%25,0.02)\' stroke-width=\'1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23a)\' width=\'100%25\' height=\'100%25\'/%3E%3C/svg%3E")' }}>
        {chatMessages.length === 0 ? (
          <Box className="flex items-center justify-center h-full">
            <Typography className="text-gray-400">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          <>
            {chatMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
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
