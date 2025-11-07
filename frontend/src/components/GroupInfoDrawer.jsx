import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, TextField, List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton, Button, Divider, Checkbox, FormControlLabel } from '@mui/material';
import { Delete, PersonAdd, Edit, ArrowBack, Close } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { addUserToGroup, removeUserFromGroup, updateGroup } from '../features/groupsSlice';
import { setConversationImage } from '../features/conversationsSlice';
import { fetchContacts } from '../features/contactsSlice';
import api from '../services/api';

const GroupInfoDrawer = ({ open, onClose, groupId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { contacts } = useSelector((state) => state.contacts);
  const [group, setGroup] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const isCreator = group && user && group.createdBy === user.id;

  useEffect(() => {
    if (!open || !groupId) return;
    const load = async () => {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
      setName(res.data?.name || '');
      setDescription(res.data?.description || '');
      setImageUrl(res.data?.imageUrl || '');
      setIsEditing(false);
      setSelectedToAdd(new Set());
    };
    load();
  }, [open, groupId]);

  useEffect(() => {
    if (open) {
      dispatch(fetchContacts({ type: 'USER' }));
    }
  }, [open, dispatch]);

  const handleSave = async () => {
    try {
      const updated = await dispatch(updateGroup({ groupId, name, description, imageUrl })).unwrap();
      setGroup(updated);
      setIsEditing(false);
      // also update conversation image locally
      dispatch(setConversationImage({ id: groupId, type: 'GROUP', imageUrl }));
    } catch (_) {}
  };

  const handleCancel = () => {
    // revert edits
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setImageUrl(group.imageUrl || '');
    }
    setIsEditing(false);
  };

  const handleAddMember = async (userId) => {
    try {
      const updated = await dispatch(addUserToGroup({ groupId, userId })).unwrap();
      setGroup(updated);
    } catch (_) {}
  };

  const toggleContactSelection = (userId) => {
    const next = new Set(selectedToAdd);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedToAdd(next);
  };

  const handleBulkAdd = async () => {
    if (selectedToAdd.size === 0) return;
    setAdding(true);
    try {
      for (const uid of selectedToAdd) {
        try {
          const updated = await dispatch(addUserToGroup({ groupId, userId: uid })).unwrap();
          setGroup(updated);
        } catch (_) {}
      }
      setSelectedToAdd(new Set());
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const updated = await dispatch(removeUserFromGroup({ groupId, userId })).unwrap();
      setGroup(updated);
    } catch (_) {}
  };

  const members = Array.isArray(group?.users) ? group.users : [];
  const [contactQuery, setContactQuery] = useState('');
  const candidateContacts = contacts
    .map((c) => c.contact)
    .filter((c) => c && c.username && c.username.toLowerCase().includes(contactQuery.toLowerCase()))
    .filter((c) => !members.some((m) => m.id === c.id));

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      {/* Header - WhatsApp-like */}
      <Box className="h-16 bg-[#075e54] flex items-center px-3 py-4 text-white position: sticky top-0 z-10">
        <IconButton size="small" onClick={onClose} className="text-white">
          <ArrowBack />
        </IconButton>
        <Typography className="ml-3 font-medium flex-1">Group info</Typography>
        {isCreator && !isEditing && (
          <IconButton size="small" onClick={() => setIsEditing(true)} className="text-white">
            <Edit />
          </IconButton>
        )}
        {isCreator && isEditing && (
          <IconButton size="small" onClick={handleCancel} className="text-white">
            <Close />
          </IconButton>
        )}
      </Box>

      <Box className="p-4">
        <Box className="flex flex-col items-center mb-4">
          <Avatar src={imageUrl} className="w-24 h-24 mb-2">{name?.[0]?.toUpperCase()}</Avatar>
          <Typography variant="h6" className="text-center">{name || 'Group'}</Typography>
        </Box>

        <Typography variant="caption" className="text-gray-500">Group name</Typography>
        <TextField fullWidth placeholder="Group name" margin="dense" value={name} onChange={(e) => setName(e.target.value)} disabled={!isCreator || !isEditing} />

        <Typography variant="caption" className="text-gray-500 mt-3">Image URL</Typography>
        <TextField fullWidth placeholder="https://..." margin="dense" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={!isCreator || !isEditing} />

        <Typography variant="caption" className="text-gray-500 mt-3">Description</Typography>
        <TextField fullWidth margin="dense" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} placeholder="Add a group description" disabled={!isCreator || !isEditing} />

        {isCreator && isEditing && (
          <Box className="flex justify-end mt-3">
            <Button onClick={handleCancel} className="mr-2">Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save</Button>
          </Box>
        )}

        <Divider className="my-3" />

        <Box className="mt-2">
          <Typography variant="subtitle2">Members ({members.length})</Typography>
          <List dense>
            {members.map((m) => (
              <ListItem key={m.id}
                secondaryAction={isCreator && m.id !== user?.id ? (
                  <IconButton edge="end" aria-label="remove" onClick={() => handleRemoveMember(m.id)}>
                    <Delete />
                  </IconButton>
                ) : null}
              >
                <ListItemAvatar>
                  <Avatar src={m.profilePictureUrl}>{m.username?.[0]?.toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={m.username} secondary={m.about} />
              </ListItem>
            ))}
          </List>
        </Box>

        {isCreator && (
          <Box className="mt-2">
            <Typography variant="subtitle2">Add members</Typography>
            <TextField fullWidth placeholder="Search contacts" size="small" margin="dense" value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} />
            <Box className="max-h-64 overflow-y-auto border border-gray-200 rounded">
              <List className="p-0">
                {candidateContacts.map((c) => (
                  <ListItem key={c.id} disablePadding>
                    <FormControlLabel
                      control={<Checkbox checked={selectedToAdd.has(c.id)} onChange={() => toggleContactSelection(c.id)} />}
                      label={
                        <Box className="flex items-center">
                          <Avatar src={c.profilePictureUrl} sx={{ width: 40, height: 40, mr: 1.5 }}>
                            {c.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box className="flex flex-col">
                            <Typography className="text-sm">{c.username}</Typography>
                            {c.about && (
                              <Typography className="text-xs text-gray-500 truncate" sx={{ maxWidth: 220 }}>{c.about}</Typography>
                            )}
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0, pl: 1 }}
                    />
                  </ListItem>
                ))}
                {candidateContacts.length === 0 && (
                  <Box className="px-3 py-2 text-xs text-gray-500">No contacts to add</Box>
                )}
              </List>
            </Box>
            <Box className="flex justify-end mt-2">
              <Button variant="contained" onClick={handleBulkAdd} disabled={adding || selectedToAdd.size === 0} startIcon={<PersonAdd />} sx={{ backgroundColor: '#25d366', '&:hover': { backgroundColor: '#20ba5a' } }}>
                {adding ? 'Adding…' : `Add (${selectedToAdd.size})`}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default GroupInfoDrawer;


