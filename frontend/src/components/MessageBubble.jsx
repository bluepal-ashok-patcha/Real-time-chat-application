import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useSelector } from 'react-redux';

const MessageBubble = ({ message }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const isSentByCurrentUser = message.sender.id === currentUser.id;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isSentByCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Paper
        sx={{
          p: 1,
          bgcolor: isSentByCurrentUser ? '#DCF8C6' : '#fff',
          borderRadius: 2,
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MessageBubble;
