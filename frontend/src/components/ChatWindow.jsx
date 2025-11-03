import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper, AppBar, Toolbar, Avatar } from '@mui/material';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, selectedContact }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {selectedContact ? (
        <>
          <AppBar position="static" sx={{ bgcolor: '#075E54' }}>
            <Toolbar>
              <Avatar sx={{ mr: 2 }}>{selectedContact.username[0].toUpperCase()}</Avatar>
              <Typography variant="h6">{selectedContact.username}</Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#ECE5DD' }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Select a contact to start chatting
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatWindow;
