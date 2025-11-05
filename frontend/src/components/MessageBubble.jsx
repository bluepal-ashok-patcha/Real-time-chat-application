import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Done, DoneAll, Info } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import MessageInfoModal from './MessageInfoModal';

const MessageBubble = ({ message }) => {
  const { user } = useSelector((state) => state.auth);
  const isSentByCurrentUser = message.sender?.id === user?.id;
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusIcon = () => {
    if (!isSentByCurrentUser) return null;
    
    if (message.status === 'READ') {
      return <DoneAll className="text-blue-500" fontSize="small" />;
    } else if (message.status === 'DELIVERED') {
      return <DoneAll className="text-gray-400" fontSize="small" />;
    } else {
      return <Done className="text-gray-400" fontSize="small" />;
    }
  };

  return (
    <Box
      className={`flex mb-1 ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
      sx={{ px: 1 }}
    >
      <Box
        className={`max-w-[65%] rounded-lg px-2 py-1 ${
          isSentByCurrentUser
            ? 'bg-[#dcf8c6] rounded-tr-none'
            : 'bg-white rounded-tl-none'
        }`}
        sx={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {/* Group message sender name */}
        {!isSentByCurrentUser && message.groupId && (
          <Typography className="text-xs font-semibold text-[#128c7e] mb-0.5">
            {message.sender?.username}
          </Typography>
        )}
        
        {/* Message content */}
        <Typography className="text-sm text-gray-900 whitespace-pre-wrap break-words">
          {message.content}
        </Typography>
        
        {/* Time and status */}
        <Box className="flex items-center justify-end gap-1 mt-0.5">
          <Typography className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </Typography>
          {getStatusIcon()}
          {/* Show info button for group messages sent by current user */}
          {isSentByCurrentUser && message.groupId && (
            <IconButton
              size="small"
              className="ml-1"
              onClick={() => setInfoModalOpen(true)}
              sx={{ padding: '2px' }}
            >
              <Info fontSize="small" className="text-gray-500" />
            </IconButton>
          )}
        </Box>
      </Box>
      <MessageInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        messageId={message.id}
      />
    </Box>
  );
};

export default MessageBubble;
