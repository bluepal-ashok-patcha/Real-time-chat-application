import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import { MoreVert, Search, AttachFile, Phone, VideoCall, Block, Delete } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { blockUser, unblockUser } from '../features/blocksSlice';
import { removeContact } from '../features/contactsSlice';
import { fetchStatus } from '../features/statusSlice';

const ChatHeader = ({ selectedContact }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { typing } = useSelector((state) => state.messages);
  const { userStatus } = useSelector((state) => state.status);
  const { blockedUsers = [] } = useSelector((state) => state.blocks);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isBlocked = blockedUsers?.some((b) => b?.blockedUser?.id === selectedContact?.id) || false;
  const contactStatus = selectedContact?.id ? userStatus[selectedContact.id] : null;
  const isOnline = contactStatus === 'online';

  useEffect(() => {
    if (selectedContact?.id && selectedContact?.type === 'PRIVATE') {
      dispatch(fetchStatus([selectedContact.id]));
    }
  }, [selectedContact, dispatch]);

  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleBlock = () => {
    if (!selectedContact?.id) return;
    if (isBlocked) {
      dispatch(unblockUser(selectedContact.id));
    } else {
      dispatch(blockUser(selectedContact.id));
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedContact?.type === 'PRIVATE' && selectedContact?.id) {
      dispatch(removeContact(selectedContact.id));
    }
    handleMenuClose();
  };

  const getStatusText = () => {
    // Show typing indicator with highest priority for current chat
    if (selectedContact?.type === 'PRIVATE') {
      const tKey = `user_${selectedContact.id}`;
      if (typing[tKey]?.typing) {
        return 'typing…';
      }
    } else if (selectedContact?.type === 'GROUP') {
      const tKey = `group_${selectedContact.id}`;
      if (typing[tKey]?.typing) {
        const who = typing[tKey]?.username || 'Someone';
        return `${who} is typing…`;
      }
    }

    if (selectedContact?.type === 'GROUP') {
      return 'Group chat';
    }
    if (isOnline) {
      return 'online';
    }
    if (contactStatus && contactStatus !== 'online') {
      const date = new Date(parseInt(contactStatus));
      return `last seen ${date.toLocaleTimeString()}`;
    }
    return 'offline';
  };

  if (!selectedContact) {
    return (
      <Box className="h-16 bg-[#f0f2f5] border-b border-gray-300 flex items-center justify-center">
        <Typography className="text-gray-500">Select a conversation to start chatting</Typography>
      </Box>
    );
  }

  return (
    <Box className="h-16 bg-[#075e54] flex items-center justify-between px-4">
      <Box className="flex items-center flex-1 min-w-0">
        <Avatar src={selectedContact.profilePictureUrl} className="w-10 h-10">
          {selectedContact.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box className="ml-3 flex-1 min-w-0">
          <Typography className="text-white font-medium text-sm truncate">
            {selectedContact.username}
          </Typography>
          <Typography className="text-white text-xs opacity-90">
            {getStatusText()}
          </Typography>
        </Box>
      </Box>
      <Box className="flex items-center gap-1">
        {selectedContact?.type === 'PRIVATE' && (
          <>
            <IconButton size="small" className="text-white">
              <Phone />
            </IconButton>
            <IconButton size="small" className="text-white">
              <VideoCall />
            </IconButton>
          </>
        )}
        <IconButton size="small" className="text-white">
          <Search />
        </IconButton>
        <IconButton size="small" className="text-white" onClick={handleMenuClick}>
          <MoreVert />
        </IconButton>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        {selectedContact?.type === 'PRIVATE' && (
          <>
            <MenuItem onClick={handleBlock}>
              <Block className="mr-2" fontSize="small" />
              {isBlocked ? 'Unblock' : 'Block'}
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <Delete className="mr-2" fontSize="small" />
              Delete Chat
            </MenuItem>
            <Divider />
          </>
        )}
        <MenuItem onClick={handleMenuClose}>View Profile</MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatHeader;

