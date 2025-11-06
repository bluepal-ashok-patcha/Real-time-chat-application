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
import { addContactByIdentifier, fetchContacts, fetchInviteContacts } from '../features/contactsSlice';
import api from '../services/api';

const AddContactModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { contacts } = useSelector((state) => state.contacts);
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const handleAdd = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResultMsg('');
    try {
      const raw = searchQuery.trim();
      let payload = { username: raw, email: null, mobile: null };
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) {
        payload = { username: null, email: raw, mobile: null };
      } else if (/^\+?[0-9]{8,15}$/.test(raw)) {
        payload = { username: null, email: null, mobile: raw };
      }
      const res = await dispatch(addContactByIdentifier(payload)).unwrap();
      if (res.found) {
        setResultMsg('Contact added.');
      } else {
        setResultMsg('No account found. Added to Invite list.');
      }
      await dispatch(fetchContacts({}));
      await dispatch(fetchInviteContacts({}));
      onClose();
    } catch (e) {
      console.error(e);
      setResultMsg('Failed to add contact');
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
            placeholder="Enter username, email or phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            InputProps={{
              startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            className="mt-2"
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </Box>
        {resultMsg && (
          <Typography className="text-gray-500 text-center py-2">{resultMsg}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContactModal;

