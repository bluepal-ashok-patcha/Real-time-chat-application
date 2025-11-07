import React, { useEffect, useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Close, Send, GroupAdd, PersonAdd, ArrowBack } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts, fetchInviteContacts, sendInviteEmail, selectContact, addContactByIdentifier } from '../features/contactsSlice';
import { setCurrentChat } from '../features/messagesSlice';
import { createGroup, addUserToGroup } from '../features/groupsSlice';

const ContactListDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { contacts, inviteContacts } = useSelector((state) => state.contacts);
  const { user } = useSelector((state) => state.auth);
  const [inviteSent, setInviteSent] = useState({}); // id -> true
  
  // View states: 'main', 'newContact', 'newGroup'
  const [view, setView] = useState('main');
  
  // New contact form fields
  const [contactForm, setContactForm] = useState({ username: '', email: '', mobile: '' });
  const [contactLoading, setContactLoading] = useState(false);
  
  // New group form fields
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchContacts({ type: 'USER' }));
      dispatch(fetchInviteContacts({}));
      setView('main');
      setContactForm({ username: '', email: '', mobile: '' });
      setGroupName('');
      setSelectedContacts(new Set());
    }
  }, [open, dispatch]);

  const handleOpenChat = (c) => {
    if (!c?.contact) return;
    dispatch(setCurrentChat({ type: 'PRIVATE', id: c.contact.id }));
    dispatch(selectContact({ id: c.contact.id, username: c.contact.username, profilePictureUrl: c.contact.profilePictureUrl, type: 'PRIVATE' }));
    onClose();
  };

  const handleInvite = async (invite) => {
    let email = invite.inviteEmail || invite.identifier;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return;
    }
    await dispatch(sendInviteEmail(email));
    setInviteSent((m) => ({ ...m, [invite.id]: true }));
  };

  const handleSubmitContact = async () => {
    if (!contactForm.username && !contactForm.email && !contactForm.mobile) {
      return;
    }
    setContactLoading(true);
    try {
      await dispatch(addContactByIdentifier(contactForm)).unwrap();
      dispatch(fetchContacts({ type: 'USER' }));
      dispatch(fetchInviteContacts({}));
      setContactForm({ username: '', email: '', mobile: '' });
      setView('main');
    } catch (e) {
      console.error('Failed to add contact:', e);
    } finally {
      setContactLoading(false);
    }
  };

  const handleSubmitGroup = async () => {
    if (!groupName.trim() || selectedContacts.size === 0) {
      return;
    }
    setGroupLoading(true);
    try {
      const group = await dispatch(createGroup(groupName.trim())).unwrap();
      // Add selected contacts to group
      for (const contactId of selectedContacts) {
        try {
          await dispatch(addUserToGroup({ groupId: group.id, userId: contactId })).unwrap();
        } catch (e) {
          console.error('Failed to add user to group:', e);
        }
      }
      setGroupName('');
      setSelectedContacts(new Set());
      setView('main');
      onClose();
    } catch (e) {
      console.error('Failed to create group:', e);
    } finally {
      setGroupLoading(false);
    }
  };

  const toggleContactSelection = (contactId) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContacts(newSet);
  };

  const getHeaderTitle = () => {
    if (view === 'newContact') return 'New contact';
    if (view === 'newGroup') return 'New group';
    return 'New chat';
  };

  const header = useMemo(() => (
    <Box className="bg-[#075e54] text-white flex items-center p-3">
      <IconButton size="small" className="text-white" onClick={() => view === 'main' ? onClose() : setView('main')}>
        {view === 'main' ? <Close /> : <ArrowBack />}
      </IconButton>
      <Typography className="ml-2 font-medium">{getHeaderTitle()}</Typography>
    </Box>
  ), [view, onClose]);

  // Render new contact form
  if (view === 'newContact') {
    return (
      <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 360 } }}>
        {header}
        <Box className="p-4" sx={{ '& > *': { mb: 2 } }}>
          <TextField
            fullWidth
            label="Username"
            placeholder="Enter username"
            value={contactForm.username}
            onChange={(e) => setContactForm({ ...contactForm, username: e.target.value })}
            variant="standard"
          />
          <TextField
            fullWidth
            label="Email"
            placeholder="Enter email address"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            variant="standard"
          />
          <TextField
            fullWidth
            label="Phone number"
            placeholder="Enter phone number"
            value={contactForm.mobile}
            onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
            variant="standard"
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmitContact}
            disabled={contactLoading || (!contactForm.username && !contactForm.email && !contactForm.mobile)}
            sx={{ mt: 3, backgroundColor: '#25d366', '&:hover': { backgroundColor: '#20ba5a' } }}
          >
            {contactLoading ? 'Adding...' : 'Save'}
          </Button>
        </Box>
      </Drawer>
    );
  }

  // Render new group form
  if (view === 'newGroup') {
    return (
      <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 360 } }}>
        {header}
        <Box className="p-4">
          <TextField
            fullWidth
            label="Group subject"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            variant="standard"
            sx={{ mb: 3 }}
          />
          <Typography className="text-xs text-gray-500 mb-2">Select contacts to add to group</Typography>
          <Box className="max-h-96 overflow-y-auto">
            <List className="p-0">
              {contacts.map((c) => (
                <ListItem key={c.id} disablePadding>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedContacts.has(c.contact?.id)}
                        onChange={() => toggleContactSelection(c.contact?.id)}
                      />
                    }
                    label={
                      <Box className="flex items-center">
                        <Avatar 
                          src={c.contact?.profilePictureUrl} 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1,
                            flexShrink: 0,
                            '& .MuiAvatar-img': {
                              objectFit: 'cover',
                              width: '100%',
                              height: '100%',
                            },
                          }}
                        >
                          {c.contact?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography>{c.contact?.username}</Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </ListItem>
              ))}
              {contacts.length === 0 && (
                <Box className="px-3 py-2 text-xs text-gray-500">No contacts available</Box>
              )}
            </List>
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmitGroup}
            disabled={groupLoading || !groupName.trim() || selectedContacts.size === 0}
            sx={{ mt: 3, backgroundColor: '#25d366', '&:hover': { backgroundColor: '#20ba5a' } }}
          >
            {groupLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </Box>
      </Drawer>
    );
  }

  // Main view
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 360 } }}>
      {header}
      <List className="p-0">
        <ListItem disablePadding>
          <ListItemButton onClick={() => setView('newGroup')}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: '#00a884' }}>
                <GroupAdd />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="New group" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setView('newContact')}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: '#00a884' }}>
                <PersonAdd />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="New contact" />
          </ListItemButton>
        </ListItem>
      </List>

      <Box className="px-2 py-1 text-xs text-gray-500">Contacts on ChatApp</Box>
      <List className="p-0">
        {contacts.map((c) => (
          <ListItem key={c.id} disablePadding>
            <ListItemButton onClick={() => handleOpenChat(c)}>
              <ListItemAvatar>
                <Avatar
                  src={c.contact?.profilePictureUrl}
                  onClick={(e) => {
                    e.stopPropagation();
                    // lazy import to avoid circular import
                    import('./ImagePreviewDialog').then(({ default: ImagePreviewDialog }) => {
                      const container = document.createElement('div');
                      document.body.appendChild(container);
                      const React = require('react');
                      const { createRoot } = require('react-dom/client');
                      const root = createRoot(container);
                      const close = () => {
                        root.unmount();
                        container.remove();
                      };
                      root.render(React.createElement(ImagePreviewDialog, { open: true, onClose: close, src: c.contact?.profilePictureUrl, title: c.contact?.username }));
                    });
                  }}
                  className="cursor-pointer flex-shrink-0"
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
                  {c.contact?.username?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={c.contact?.username} secondary={c.contact?.about} />
            </ListItemButton>
          </ListItem>
        ))}
        {contacts.length === 0 && (
          <Box className="px-3 py-2 text-xs text-gray-500">No contacts</Box>
        )}
      </List>

      <Divider />
      <Box className="px-2 py-1 text-xs text-gray-500">Invite to WhatsApp</Box>
      <List className="p-0">
        {inviteContacts.map((c) => (
          <ListItem key={c.id} secondaryAction={
            <Button size="small" variant="contained" onClick={() => handleInvite(c)} startIcon={<Send />} disabled={!!inviteSent[c.id]} sx={{ backgroundColor: '#25d366', '&:hover': { backgroundColor: '#20ba5a' } }}>
              {inviteSent[c.id] ? 'Invited' : 'Invite'}
            </Button>
          }>
            <ListItemAvatar>
              <Avatar>{c.identifier?.[0]?.toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={c.inviteUsername || c.identifier} secondary={c.inviteEmail || 'Not on ChatApp'} />
          </ListItem>
        ))}
        {inviteContacts.length === 0 && (
          <Box className="px-3 py-2 text-xs text-gray-500">No invite suggestions</Box>
        )}
      </List>
    </Drawer>
  );
};

export default ContactListDrawer;


