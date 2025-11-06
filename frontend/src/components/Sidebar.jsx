import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemButton, Avatar, Typography, TextField, IconButton, Badge, Divider } from '@mui/material';
import { Search as SearchIcon, MoreVert, Logout, Contacts as ContactsIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { selectContact, clearSelectedContact } from '../features/contactsSlice';
import { fetchConversations } from '../features/conversationsSlice';
import { setCurrentChat } from '../features/messagesSlice';
import CreateGroupModal from './CreateGroupModal';
import AddContactModal from './AddContactModal';
import ProfileMenu from './ProfileMenu';
import ContactListDrawer from './ContactListDrawer';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations } = useSelector((state) => state.conversations);
  const { selectedContact } = useSelector((state) => state.contacts);
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contactsDrawerOpen, setContactsDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  useEffect(() => {
    dispatch(fetchConversations());
    const interval = setInterval(() => {
      dispatch(fetchConversations());
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleConversationClick = (conversation) => {
    dispatch(clearSelectedContact());
    dispatch(setCurrentChat({ type: conversation.type, id: conversation.id }));
    
    if (conversation.type === 'PRIVATE') {
      dispatch(selectContact({
        id: conversation.id,
        username: conversation.name,
        profilePictureUrl: conversation.profilePictureUrl,
        type: 'PRIVATE'
      }));
    } else {
      dispatch(selectContact({
        id: conversation.id,
        username: conversation.name,
        type: 'GROUP'
      }));
    }
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessage = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    return conversation.lastMessage.length > 50
      ? conversation.lastMessage.substring(0, 50) + '...'
      : conversation.lastMessage;
  };

  return (
    <Box className="flex flex-col h-full bg-[#f0f2f5] border-r border-gray-300" sx={{ width: '350px', minWidth: '350px' }}>
      {/* Header */}
      <Box className="bg-[#075e54] p-3 flex items-center justify-between">
        <Avatar src={user?.profilePictureUrl} className="cursor-pointer" onClick={(e) => setProfileMenuAnchor(e.currentTarget)}>
          {user?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box className="flex gap-1">
          <IconButton size="small" className="text-white" onClick={() => setContactsDrawerOpen(true)}>
            <ContactsIcon />
          </IconButton>
          <IconButton size="small" className="text-white">
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Search */}
      <Box className="p-2 bg-white">
        <TextField
          fullWidth
          size="small"
          placeholder="Search or start new chat"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
            sx: {
              backgroundColor: '#f0f2f5',
              borderRadius: '24px',
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      {/* Conversations List */}
      <Box className="flex-1 overflow-y-auto bg-white">
        <List className="p-0">
          {filteredConversations.map((conversation, index) => {
            const isSelected = selectedContact?.id === conversation.id && 
                             selectedContact?.type === (conversation.type === 'GROUP' ? 'GROUP' : 'PRIVATE');
            
            return (
              <React.Fragment key={`${conversation.type}-${conversation.id}`}>
                <ListItem
                  disablePadding
                  className={isSelected ? 'bg-[#e9edef]' : ''}
                >
                  <ListItemButton
                    onClick={() => handleConversationClick(conversation)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': { backgroundColor: '#f5f6f6' },
                      backgroundColor: isSelected ? '#e9edef' : 'transparent',
                    }}
                  >
                  <Box className="flex items-center w-full">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        conversation.type === 'PRIVATE' && conversation.unreadCount > 0 ? (
                          <Box className="w-5 h-5 rounded-full bg-[#25d366] flex items-center justify-center text-white text-xs">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </Box>
                        ) : null
                      }
                    >
                      <Avatar
                        src={conversation.profilePictureUrl}
                        className="w-12 h-12"
                      >
                        {conversation.name?.[0]?.toUpperCase()}
                      </Avatar>
                    </Badge>
                    <Box className="flex-1 ml-3 min-w-0">
                      <Box className="flex items-center justify-between mb-1">
                        <Typography className="text-sm font-medium text-gray-900 truncate">
                          {conversation.name}
                        </Typography>
                        <Typography className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatTime(conversation.lastMessageTimestamp)}
                        </Typography>
                      </Box>
                      <Box className="flex items-center justify-between">
                        <Typography className="text-xs text-gray-600 truncate flex-1">
                          {getLastMessage(conversation)}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Box className="ml-2 w-5 h-5 rounded-full bg-[#25d366] flex items-center justify-center text-white text-xs">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  </ListItemButton>
                </ListItem>
                {index < filteredConversations.length - 1 && <Divider className="ml-16" />}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Modals */}
      {/* CreateGroup and AddContact modals removed per WhatsApp-like UX */}
      <ContactListDrawer open={contactsDrawerOpen} onClose={() => setContactsDrawerOpen(false)} />
      <ProfileMenu anchorEl={profileMenuAnchor} onClose={() => setProfileMenuAnchor(null)} onLogout={handleLogout} />
    </Box>
  );
};

export default Sidebar;
