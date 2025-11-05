import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { addContact, fetchContacts } from '../features/contactsSlice';
import api from '../services/api';

const AddContactModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { contacts } = useSelector((state) => state.contacts);
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Note: You'll need to implement a search users API endpoint
      // For now, we'll search through existing contacts
      const response = await api.get(`/chat/users/search?q=${searchQuery}`);
      const existingContactIds = contacts.map((c) => c.contact.id);
      const filtered = response.data.filter((u) => u.id !== user.id && !existingContactIds.includes(u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (contactId) => {
    try {
      await dispatch(addContact(contactId)).unwrap();
      setSearchResults([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Failed to add contact:', error);
      alert('Failed to add contact. They may already be in your contacts.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Contact</DialogTitle>
      <DialogContent>
        <Box className="mb-4">
          <TextField
            fullWidth
            placeholder="Search by username or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            className="mt-2"
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>

        {searchResults.length > 0 && (
          <List>
            {searchResults.map((user) => (
              <ListItem key={user.id} button onClick={() => handleAddContact(user.id)}>
                <ListItemAvatar>
                  <Avatar src={user.profilePictureUrl}>{user.username[0]?.toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        )}

        {searchQuery && searchResults.length === 0 && !loading && (
          <Typography className="text-gray-500 text-center py-4">
            No users found
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContactModal;

