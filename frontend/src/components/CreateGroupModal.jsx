import React, { useState, useEffect } from 'react';
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
  ListItemButton,
  Checkbox,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { createGroup, addUserToGroup } from '../features/groupsSlice';
import { fetchContacts } from '../features/contactsSlice';

const CreateGroupModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { contacts } = useSelector((state) => state.contacts);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchContacts());
    }
  }, [open, dispatch]);

  const handleToggleContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) {
      alert('Please enter a group name and select at least one contact');
      return;
    }

    setLoading(true);
    try {
      const group = await dispatch(createGroup(groupName.trim())).unwrap();
      
      // Add selected contacts to group
      for (const contactId of selectedContacts) {
        try {
          await dispatch(addUserToGroup({ groupId: group.id, userId: contactId })).unwrap();
        } catch (error) {
          console.error(`Failed to add user ${contactId} to group:`, error);
        }
      }

      setGroupName('');
      setSelectedContacts([]);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="mb-4"
          margin="normal"
        />

        <Typography variant="subtitle2" className="mb-2">
          Select Contacts ({selectedContacts.length} selected)
        </Typography>

        <Box className="max-h-64 overflow-y-auto border border-gray-200 rounded">
          <List dense>
            {contacts.map((contact) => (
              <ListItem key={contact.contact.id} disablePadding>
                <ListItemButton onClick={() => handleToggleContact(contact.contact.id)}>
                  <Checkbox
                    edge="start"
                    checked={selectedContacts.includes(contact.contact.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemAvatar>
                    <Avatar src={contact.contact.profilePictureUrl}>
                      {contact.contact.username[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={contact.contact.username} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreateGroup}
          variant="contained"
          disabled={loading || !groupName.trim() || selectedContacts.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupModal;
