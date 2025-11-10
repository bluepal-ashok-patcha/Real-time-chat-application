import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Popover } from '@mui/material';
import { Send, AttachFile, EmojiEmotions } from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react'; // 👈 import this
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, setTyping } from '../features/messagesSlice';
import { sendTypingNotification } from '../services/websocket';

const MessageInput = ({ selectedContact }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { blockedUsers = [] } = useSelector((state) => state.blocks || {});
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  // 👇 new state for emoji picker
  const [anchorEl, setAnchorEl] = useState(null);

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleEmojiOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // typing logic (unchanged)
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = () => {
    if (!selectedContact) return;
    if (selectedContact.type === 'GROUP') {
      sendTypingNotification({ sender: user.username, groupId: selectedContact.id, typing: true });
    } else {
      sendTypingNotification({ sender: user.username, receiver: selectedContact.username, typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (selectedContact.type === 'GROUP') {
        sendTypingNotification({ sender: user.username, groupId: selectedContact.id, typing: false });
      } else {
        sendTypingNotification({ sender: user.username, receiver: selectedContact.username, typing: false });
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
    handleEmojiClose();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (selectedContact.type === 'GROUP') {
      sendTypingNotification({ sender: user.username, groupId: selectedContact.id, typing: false });
    } else {
      sendTypingNotification({ sender: user.username, receiver: selectedContact.username, typing: false });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedContact) return null;
  const isBlocked = selectedContact?.type === 'PRIVATE' && blockedUsers?.some((b) => b?.blockedUser?.id === selectedContact?.id);

  return (
    <Box className="bg-[#f0f2f5] p-2 border-t border-gray-300">
      {isBlocked && (
        <Box className="mb-2 text-center text-xs text-gray-600">
          You blocked this contact. Unblock to send messages.
        </Box>
      )}
      <Box className="flex items-center gap-2">
        {/* 😄 Emoji Button */}
        <IconButton size="small" className="text-gray-600" onClick={handleEmojiOpen}>
          <EmojiEmotions />
        </IconButton>

        {/* 📁 Attach file */}
        <IconButton size="small" className="text-gray-600">
          <AttachFile />
        </IconButton>

        {/* 💬 Text Field */}
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
              '& fieldset': { border: 'none' },
            },
          }}
        />

        {/* 🚀 Send Button */}
        <IconButton
          size="small"
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

      {/* 🧩 Emoji Picker Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleEmojiClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </Popover>
    </Box>
  );
};

export default MessageInput;
