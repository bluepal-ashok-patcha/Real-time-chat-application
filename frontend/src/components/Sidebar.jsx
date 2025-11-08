import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemButton, Avatar, Typography, TextField, IconButton, Badge, Divider } from '@mui/material';
import { Search as SearchIcon, MoreVert, Logout, Contacts as ContactsIcon, DoneAll } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { selectContact, clearSelectedContact } from '../features/contactsSlice';
import { fetchConversations, setConversationImage } from '../features/conversationsSlice';
import ImagePreviewDialog from './ImagePreviewDialog';
import { setCurrentChat } from '../features/messagesSlice';
import CreateGroupModal from './CreateGroupModal';
import AddContactModal from './AddContactModal';
import ProfileMenu from './ProfileMenu';
import ProfileDrawer from './ProfileDrawer';
import ContactListDrawer from './ContactListDrawer';
import api from '../services/api';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations } = useSelector((state) => state.conversations);
  const { selectedContact } = useSelector((state) => state.contacts);
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | UNREAD | GROUPS
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contactsDrawerOpen, setContactsDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState({ open: false, src: '', title: '' });
  const requestedGroupImagesRef = React.useRef(new Set());

  useEffect(() => {
    dispatch(fetchConversations());
    const interval = setInterval(() => {
      dispatch(fetchConversations());
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [dispatch]);

  // Preload missing group images for conversations (so avatars show without clicking or refreshing)
  useEffect(() => {
    const fetchMissingGroupImages = async () => {
      const toFetch = (conversations || [])
        .filter((c) => c.type === 'GROUP' && !c.profilePictureUrl && !requestedGroupImagesRef.current.has(c.id));
      if (toFetch.length === 0) return;
      for (const c of toFetch) {
        requestedGroupImagesRef.current.add(c.id);
        try {
          const res = await api.get(`/groups/${c.id}`);
          const imageUrl = res.data?.imageUrl || null;
          if (imageUrl) {
            dispatch(setConversationImage({ id: c.id, type: 'GROUP', imageUrl }));
          }
        } catch (_) {
          // ignore
        }
      }
    };
    fetchMissingGroupImages();
  }, [conversations, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleConversationClick = async (conversation) => {
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
      try {
        const res = await (await import('../services/api')).default.get(`/groups/${conversation.id}`);
        const imageUrl = res.data?.imageUrl || null;
        dispatch(setConversationImage({ id: conversation.id, type: 'GROUP', imageUrl }));
        dispatch(selectContact({
          id: conversation.id,
          username: conversation.name,
          profilePictureUrl: imageUrl,
          type: 'GROUP'
        }));
      } catch (_) {
        dispatch(selectContact({ id: conversation.id, username: conversation.name, type: 'GROUP' }));
      }
    }
  };

  const filteredConversations = conversations
    .filter((conversation) => {
      if (filter === 'UNREAD') return (conversation.unreadCount || 0) > 0;
      if (filter === 'GROUPS') return conversation.type === 'GROUP';
      return true; // ALL
    })
    .filter((conversation) =>
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

  const getLastMessageWithTicks = (conversation) => {
    const text = conversation.lastMessage ? (
      conversation.lastMessage.length > 50
        ? conversation.lastMessage.substring(0, 50) + '...'
        : conversation.lastMessage
    ) : 'No messages yet';

    // Show ticks for my last message (both PRIVATE and GROUP)
    const isSentByMe = user?.id && conversation.lastMessage && conversation.lastMessageSenderId === user.id;
    if (!isSentByMe) return text;

    const status = conversation.lastMessageStatus; // READ or DELIVERED
    const color = status === 'READ' ? '#34B7F1' : '#9aa0a6';

    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <DoneAll fontSize="inherit" sx={{ color }} />
        <span>{text}</span>
      </Box>
    );
  };

  return (
    <Box className="flex flex-col h-full bg-[#f0f2f5] border-r border-gray-300" sx={{ width: '350px', minWidth: '350px' }}>
      {/* Header */}
      <Box className="bg-[#075e54] p-3 flex items-center justify-between">
        <Avatar 
          src={user?.profilePictureUrl} 
          className="cursor-pointer flex-shrink-0"
          onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
          sx={{
            width: 40,
            height: 40,
            '& .MuiAvatar-img': {
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            },
          }}
        >
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

      {/* Filters + Search */}
      <Box className="p-2 bg-white">
        <Box className="flex gap-2 mb-2">
          <Box
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-full cursor-pointer text-xs ${filter === 'ALL' ? 'bg-[#d9fdd3] text-[#116149]' : 'bg-[#f0f2f5] text-gray-600'}`}
          >
            All
          </Box>
          <Box
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1 rounded-full cursor-pointer text-xs ${filter === 'UNREAD' ? 'bg-[#d9fdd3] text-[#116149]' : 'bg-[#f0f2f5] text-gray-600'}`}
          >
            Unread
          </Box>
          <Box
            onClick={() => setFilter('GROUPS')}
            className={`px-3 py-1 rounded-full cursor-pointer text-xs ${filter === 'GROUPS' ? 'bg-[#d9fdd3] text-[#116149]' : 'bg-[#f0f2f5] text-gray-600'}`}
          >
            Groups
          </Box>
        </Box>
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
                    <Avatar
                      src={conversation.profilePictureUrl}
                      className="cursor-pointer flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (conversation.profilePictureUrl) {
                          setImagePreview({ open: true, src: conversation.profilePictureUrl, title: conversation.name });
                        }
                      }}
                      sx={{
                        width: 48,
                        height: 48,
                        '& .MuiAvatar-img': {
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%',
                        },
                      }}
                    >
                      {conversation.name?.[0]?.toUpperCase()}
                    </Avatar>
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
                          {getLastMessageWithTicks(conversation)}
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
      <ProfileMenu anchorEl={profileMenuAnchor} onClose={() => setProfileMenuAnchor(null)} onLogout={handleLogout} onOpenProfileDrawer={() => setProfileDrawerOpen(true)} />
      <ProfileDrawer open={profileDrawerOpen} onClose={() => setProfileDrawerOpen(false)} />
      <ImagePreviewDialog open={imagePreview.open} onClose={() => setImagePreview({ open: false, src: '', title: '' })} src={imagePreview.src} title={imagePreview.title} />
    </Box>
  );
};

export default Sidebar;
