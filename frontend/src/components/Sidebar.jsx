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

const Sidebar = ({ contacts, onSelectContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const filteredContacts = contacts.filter((contact) =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          placeholder="Search contacts..."
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
        {filteredContacts.map((contact) => (
          <ListItem button key={contact.id} onClick={() => onSelectContact(contact)}>
            <ListItemAvatar>
              <Avatar>{contact.username[0].toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={contact.username} />
          </ListItem>
        ))}
      </List>
      <CreateGroupModal open={open} handleClose={handleClose} handleCreateGroup={handleCreateGroup} />
    </Drawer>
  );
};

export default Sidebar;
