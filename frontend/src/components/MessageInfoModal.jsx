import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Divider,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../services/api';

const MessageInfoDrawer = ({ open, onClose, messageId }) => {
  const { user } = useSelector((state) => state.auth);
  const [messageInfo, setMessageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && messageId) {
      fetchMessageInfo();
    } else {
      setMessageInfo(null);
    }
  }, [open, messageId]);

  const fetchMessageInfo = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chat/messages/${messageId}/info`);
      setMessageInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch message info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      {/* Header - WhatsApp-like */}
      <Box className="h-16 bg-[#075e54] flex items-center px-3 text-white">
        <IconButton size="small" onClick={onClose} className="text-white">
          <ArrowBack />
        </IconButton>
        <Typography className="ml-3 font-medium flex-1">Message info</Typography>
      </Box>

      <Box className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <Box className="flex justify-center py-8">
            <CircularProgress />
          </Box>
        ) : messageInfo ? (
          <>
            {messageInfo.readBy && messageInfo.readBy.length > 0 && (
              <>
                <Box className="px-4 py-3 bg-[#f0f2f5]">
                  <Typography variant="subtitle2" className="text-gray-600 font-medium">
                    Read by ({messageInfo.readBy.length})
                  </Typography>
                </Box>
                <List className="p-0">
                  {messageInfo.readBy.map((user, index) => (
                    <React.Fragment key={user.id || index}>
                      <ListItem
                        sx={{
                          py: 1.5,
                          px: 3,
                          '&:hover': { backgroundColor: '#f5f6f6' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={user.profilePictureUrl}
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
                            {user.username?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography className="text-sm font-medium text-gray-900">
                              {user.username}
                            </Typography>
                          }
                          secondary={
                            <Typography className="text-xs text-gray-500">
                              {formatTime(new Date())}
                            </Typography>
                          }
                        />
                        <Box className="ml-2">
                          <Typography className="text-xs text-[#34B7F1] font-medium">Read</Typography>
                        </Box>
                      </ListItem>
                      {index < messageInfo.readBy.length - 1 && <Divider className="ml-16" />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}

            {messageInfo.deliveredTo && messageInfo.deliveredTo.length > 0 && (
              <>
                <Box className="px-4 py-3 bg-[#f0f2f5]">
                  <Typography variant="subtitle2" className="text-gray-600 font-medium">
                    Delivered to ({messageInfo.deliveredTo.length})
                  </Typography>
                </Box>
                <List className="p-0">
                  {messageInfo.deliveredTo.map((user, index) => (
                    <React.Fragment key={user.id || index}>
                      <ListItem
                        sx={{
                          py: 1.5,
                          px: 3,
                          '&:hover': { backgroundColor: '#f5f6f6' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={user.profilePictureUrl}
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
                            {user.username?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography className="text-sm font-medium text-gray-900">
                              {user.username}
                            </Typography>
                          }
                          secondary={
                            <Typography className="text-xs text-gray-500">
                              {formatTime(new Date())}
                            </Typography>
                          }
                        />
                        <Box className="ml-2">
                          <Typography className="text-xs text-gray-500 font-medium">Delivered</Typography>
                        </Box>
                      </ListItem>
                      {index < messageInfo.deliveredTo.length - 1 && <Divider className="ml-16" />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}

            {(!messageInfo.readBy || messageInfo.readBy.length === 0) &&
              (!messageInfo.deliveredTo || messageInfo.deliveredTo.length === 0) && (
                <Box className="flex flex-col items-center justify-center py-16 px-4">
                  <Typography className="text-center text-gray-500 text-sm">
                    No delivery information available
                  </Typography>
                </Box>
              )}
          </>
        ) : (
          <Box className="flex flex-col items-center justify-center py-16 px-4">
            <Typography className="text-center text-gray-500 text-sm">
              No information available
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default MessageInfoDrawer;

