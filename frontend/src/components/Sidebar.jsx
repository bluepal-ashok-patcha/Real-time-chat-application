import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box, IconButton, TextField, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import CreateGroupModal from './CreateGroupModal';
import api from '../services/api';
import { useSelector } from 'react-redux';
import { Badge } from '@mui/material';

const Sidebar = ({ onSelectContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations } = useSelector((state) => state.conversations);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCreateGroup = async (groupName) => {
    try {
      await api.post('/groups', { name: groupName });
      // You might want to refetch the contacts/groups list here
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter(
        (conversation) =>
          conversation.name &&
          conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 300,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Chats
        </Typography>
        <IconButton onClick={handleOpen}>
          <AddCircleOutlineIcon />
        </IconButton>
        <IconButton onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          variant="outlined"
          size="small"
        />
      </Box>
      <List>
        {filteredConversations &&
          filteredConversations
            .filter((conversation) => conversation && conversation.name) // Add this line to filter out invalid conversations
            .map((conversation) => (
              <ListItem button key={`${conversation.type}-${conversation.id}`} onClick={() => onSelectContact(conversation)}>
                <ListItemAvatar>
                  <Avatar src={conversation.profilePictureUrl}>
                    {conversation.name[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={conversation.name}
                  secondary={
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {conversation.lastMessage}
                    </Typography>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(conversation.lastMessageTimestamp).toLocaleTimeString()}
                  </Typography>
                  {conversation.unreadCount > 0 && (
                    <Badge badgeContent={conversation.unreadCount} color="primary" />
                  )}
                </Box>
              </ListItem>
            ))}
      </List>
      <CreateGroupModal open={open} handleClose={handleClose} handleCreateGroup={handleCreateGroup} />
    </Drawer>
  );
};

export default Sidebar;
