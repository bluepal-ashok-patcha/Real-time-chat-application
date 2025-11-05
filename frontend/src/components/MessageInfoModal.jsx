import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Divider,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { getMessageInfo } from '../features/messagesSlice';
import api from '../services/api';

const MessageInfoModal = ({ open, onClose, messageId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [messageInfo, setMessageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && messageId) {
      fetchMessageInfo();
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Message Info</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box className="flex justify-center py-8">
            <CircularProgress />
          </Box>
        ) : messageInfo ? (
          <>
            {messageInfo.readBy && messageInfo.readBy.length > 0 && (
              <>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Read by ({messageInfo.readBy.length})
                </Typography>
                <List dense>
                  {messageInfo.readBy.map((user, index) => (
                    <React.Fragment key={user.id || index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={user.profilePictureUrl}>
                            {user.username?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.username}
                          secondary={formatTime(new Date())}
                        />
                        <Chip label="Read" size="small" color="primary" />
                      </ListItem>
                      {index < messageInfo.readBy.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}

            {messageInfo.deliveredTo && messageInfo.deliveredTo.length > 0 && (
              <>
                <Typography variant="subtitle2" className="mb-2 mt-4 text-gray-600">
                  Delivered to ({messageInfo.deliveredTo.length})
                </Typography>
                <List dense>
                  {messageInfo.deliveredTo.map((user, index) => (
                    <React.Fragment key={user.id || index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={user.profilePictureUrl}>
                            {user.username?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.username}
                          secondary={formatTime(new Date())}
                        />
                        <Chip label="Delivered" size="small" />
                      </ListItem>
                      {index < messageInfo.deliveredTo.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}

            {(!messageInfo.readBy || messageInfo.readBy.length === 0) &&
              (!messageInfo.deliveredTo || messageInfo.deliveredTo.length === 0) && (
                <Typography className="text-center py-8 text-gray-500">
                  No delivery information available
                </Typography>
              )}
          </>
        ) : (
          <Typography className="text-center py-8 text-gray-500">
            No information available
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageInfoModal;

