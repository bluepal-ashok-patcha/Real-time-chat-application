import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import { ArrowBack, Search as SearchIcon, Clear } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChat } from '../features/messagesSlice';
import { selectContact } from '../features/contactsSlice';
import api from '../services/api';

const SearchDrawer = ({ open, onClose, onMessageSelect }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setPage(0);
      setHasMore(false);
    }
  }, [open]);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery, 0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query, pageNum) => {
    if (!query.trim()) return;

    try {
      const response = await api.get('/chat/messages/search', {
        params: {
          query: query.trim(),
          page: pageNum,
          size: 20,
        },
      });

      const data = response.data;
      if (pageNum === 0) {
        setSearchResults(data.content || []);
      } else {
        setSearchResults((prev) => [...prev, ...(data.content || [])]);
      }
      setHasMore(!data.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      performSearch(searchQuery, page + 1);
    }
  };

  const handleMessageClick = async (message) => {
    // Determine chat type and ID
    let chatType, chatId, contactName, contactImage;

    if (message.groupId) {
      chatType = 'GROUP';
      chatId = message.groupId;
      try {
        const res = await api.get(`/groups/${chatId}`);
        contactName = res.data?.name || 'Group';
        contactImage = res.data?.imageUrl || null;
      } catch (_) {
        contactName = 'Group';
      }
    } else {
      chatType = 'PRIVATE';
      // Determine the other user (not current user)
      const otherUser = message.sender?.id === user?.id ? message.receiver : message.sender;
      chatId = otherUser?.id;
      contactName = otherUser?.username || 'User';
      contactImage = otherUser?.profilePictureUrl || null;
    }

    if (chatId) {
      // Set current chat
      dispatch(setCurrentChat({ type: chatType, id: chatId }));
      
      // Set selected contact
      dispatch(selectContact({
        id: chatId,
        username: contactName,
        profilePictureUrl: contactImage,
        type: chatType,
      }));

      // Close drawer
      onClose();

      // Notify parent to scroll to message
      if (onMessageSelect) {
        // Wait for chat to be set and messages to be loaded
        // First delay for chat to be set
        setTimeout(() => {
          // Second delay for messages to be fetched
          setTimeout(() => {
            onMessageSelect(message.id);
          }, 800);
        }, 200);
      }
    }
  };

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

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: '#fff3cd', fontWeight: 600 }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getChatName = (message) => {
    if (message.groupId) {
      return 'Group';
    }
    const otherUser = message.sender?.id === user?.id ? message.receiver : message.sender;
    return otherUser?.username || 'User';
  };

  const getChatImage = (message) => {
    if (message.groupId) {
      return null; // Will be fetched when clicked
    }
    const otherUser = message.sender?.id === user?.id ? message.receiver : message.sender;
    return otherUser?.profilePictureUrl || null;
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      {/* Header */}
      <Box className="h-16 bg-[#075e54] flex items-center px-3 text-white">
        <IconButton size="small" onClick={onClose} className="text-white">
          <ArrowBack />
        </IconButton>
        <Typography className="ml-3 font-medium flex-1">Search messages</Typography>
      </Box>

      {/* Search Input */}
      <Box className="p-3 bg-white border-b border-gray-200">
        <TextField
          fullWidth
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className="text-gray-400" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400"
                >
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#f0f2f5',
              borderRadius: '24px',
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      {/* Results */}
      <Box className="flex-1 overflow-y-auto bg-white">
        {loading && searchResults.length === 0 ? (
          <Box className="flex justify-center py-8">
            <CircularProgress />
          </Box>
        ) : searchQuery.trim() && searchResults.length === 0 ? (
          <Box className="flex flex-col items-center justify-center py-16 px-4">
            <Typography className="text-gray-500 text-center">
              No messages found
            </Typography>
            <Typography className="text-gray-400 text-sm text-center mt-2">
              Try searching with different keywords
            </Typography>
          </Box>
        ) : !searchQuery.trim() ? (
          <Box className="flex flex-col items-center justify-center py-16 px-4">
            <SearchIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
            <Typography className="text-gray-500 text-center">
              Search messages across all your conversations
            </Typography>
          </Box>
        ) : (
          <List className="p-0">
            {searchResults.map((message, index) => (
              <React.Fragment key={`${message.id}-${index}`}>
                <ListItem
                  button
                  onClick={() => handleMessageClick(message)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    '&:hover': { backgroundColor: '#f5f6f6' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={getChatImage(message)}
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
                      {getChatName(message)?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box className="flex items-center justify-between">
                        <Typography className="text-sm font-medium text-gray-900">
                          {getChatName(message)}
                        </Typography>
                        <Typography className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {highlightText(message.content || '', searchQuery)}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < searchResults.length - 1 && <Divider className="ml-16" />}
              </React.Fragment>
            ))}
            {hasMore && (
              <ListItem
                button
                onClick={handleLoadMore}
                sx={{
                  py: 2,
                  justifyContent: 'center',
                  '&:hover': { backgroundColor: '#f5f6f6' },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography className="text-sm text-[#128c7e] font-medium">
                    Load more results
                  </Typography>
                )}
              </ListItem>
            )}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default SearchDrawer;

