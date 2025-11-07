import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send, AttachFile, EmojiEmotions } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage } from '../features/messagesSlice';
import { sendTypingNotification } from '../services/websocket';
import { setTyping } from '../features/messagesSlice';

const MessageInput = ({ selectedContact }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { blockedUsers = [] } = useSelector((state) => state.blocks || {});
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (!selectedContact) return;

    // Send typing notification
    if (selectedContact.type === 'GROUP') {
      sendTypingNotification({
        sender: user.username,
        groupId: selectedContact.id,
        typing: true,
      });
    } else {
      sendTypingNotification({
        sender: user.username,
        receiver: selectedContact.username,
        typing: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedContact.type === 'GROUP') {
        sendTypingNotification({
          sender: user.username,
          groupId: selectedContact.id,
          typing: false,
        });
      } else {
        sendTypingNotification({
          sender: user.username,
          receiver: selectedContact.username,
          typing: false,
        });
      }
    }, 3000);
  };

  const handleSend = () => {
    if (!message.trim() || !selectedContact) return;

    const messageData = {
      receiverId: selectedContact.type === 'PRIVATE' ? selectedContact.id : null,
      groupId: selectedContact.type === 'GROUP' ? selectedContact.id : null,
      content: message.trim(),
    };

    dispatch(sendMessage(messageData));
    setMessage('');

    // Stop typing notification
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (selectedContact.type === 'GROUP') {
      sendTypingNotification({
        sender: user.username,
        groupId: selectedContact.id,
        typing: false,
      });
    } else {
      sendTypingNotification({
        sender: user.username,
        receiver: selectedContact.username,
        typing: false,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedContact) {
    return null;
  }

  const isBlocked = selectedContact?.type === 'PRIVATE' && blockedUsers?.some((b) => b?.blockedUser?.id === selectedContact?.id);

  return (
    <Box className="bg-[#f0f2f5] p-2 border-t border-gray-300">
      {isBlocked && (
        <Box className="mb-2 text-center text-xs text-gray-600">
          You blocked this contact. Unblock to send messages.
        </Box>
      )}
      <Box className="flex items-center gap-2">
      <IconButton size="small" className="text-gray-600">
        <EmojiEmotions />
      </IconButton>
      <IconButton size="small" className="text-gray-600">
        <AttachFile />
      </IconButton>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        onKeyPress={handleKeyPress}
        variant="outlined"
        size="small"
          disabled={isBlocked}
        InputProps={{
          sx: {
            backgroundColor: 'white',
            borderRadius: '24px',
            '& fieldset': {
              border: 'none',
            },
          },
        }}
      />
      <IconButton
        size="small"
        className="bg-[#25d366] text-white hover:bg-[#20ba5a]"
        onClick={handleSend}
          disabled={!message.trim() || isBlocked}
        sx={{
          backgroundColor: '#25d366',
          color: 'white',
          '&:hover': { backgroundColor: '#20ba5a' },
          '&.Mui-disabled': { backgroundColor: '#ccc' },
        }}
      >
        <Send />
      </IconButton>
      </Box>
    </Box>
  );
};

export default MessageInput;
