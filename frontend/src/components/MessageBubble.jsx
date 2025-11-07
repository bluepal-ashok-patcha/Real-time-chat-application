import React, { useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { Done, DoneAll, KeyboardArrowDown } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import MessageInfoDrawer from './MessageInfoModal';

const MessageBubble = ({ message }) => {
  const { user } = useSelector((state) => state.auth);
  const isSentByCurrentUser = message.sender?.id === user?.id;
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showArrow, setShowArrow] = useState(false);

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
      onMouseEnter={() => isSentByCurrentUser && message.groupId && setShowArrow(true)}
      onMouseLeave={() => setShowArrow(false)}
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
          {/* Show down arrow button for group messages sent by current user - appears on hover */}
          {isSentByCurrentUser && message.groupId && (
            <IconButton
              size="small"
              className="ml-1"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ 
                padding: '2px',
                opacity: showArrow ? 1 : 0,
                transition: 'opacity 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <KeyboardArrowDown fontSize="small" className="text-gray-500" />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {/* Menu for message options */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 180,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            borderRadius: '4px',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setInfoDrawerOpen(true);
            setMenuAnchor(null);
          }}
          sx={{
            fontSize: '14px',
            py: 1,
            '&:hover': {
              backgroundColor: '#f5f6f6',
            },
          }}
        >
          Message info
        </MenuItem>
      </Menu>
      
      <MessageInfoDrawer
        open={infoDrawerOpen}
        onClose={() => setInfoDrawerOpen(false)}
        messageId={message.id}
      />
    </Box>
  );
};

export default MessageBubble;
