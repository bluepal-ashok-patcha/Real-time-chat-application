import React, { useState, useEffect } from 'react';
import { Drawer, Box, Avatar, Typography, TextField, Button, IconButton, Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../features/authSlice';
import { ArrowBack } from '@mui/icons-material';

const ProfileDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    if (open) {
      setProfilePictureUrl(user?.profilePictureUrl || '');
      setAbout(user?.about || '');
    }
  }, [open, user]);

  const handleSave = async () => {
    try {
      await dispatch(updateProfile({ profilePictureUrl, about })).unwrap();
      onClose();
    } catch (_) {}
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box className="h-16 bg-[#075e54] flex items-center px-3 text-white">
        <IconButton size="small" onClick={onClose} className="text-white">
          <ArrowBack />
        </IconButton>
        <Typography className="ml-3 font-medium">Profile</Typography>
      </Box>
      <Box className="p-4">
        <Box className="flex flex-col items-center mb-4">
          <Avatar 
            src={profilePictureUrl} 
            className="mb-2 flex-shrink-0"
            sx={{
              width: 96,
              height: 96,
              '& .MuiAvatar-img': {
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              },
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h6">{user?.username}</Typography>
          {user?.email && (
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          )}
        </Box>
        <Typography variant="caption" className="text-gray-500">Profile picture URL</Typography>
        <TextField
          fullWidth
          placeholder="https://..."
          value={profilePictureUrl}
          onChange={(e) => setProfilePictureUrl(e.target.value)}
          margin="dense"
          variant="standard"
        />
        {/* <Divider className="my-3" /> */}
        <Typography variant="caption" className="text-gray-500">About</Typography>
        <TextField
          fullWidth
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          margin="dense"
          // multiline
          rows={3}
          variant="standard"
          placeholder="Hey there! I am using ChatApp."
        />
        <Box className="flex justify-end mt-3">
          <Button onClick={onClose} className="mr-2">Close</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ProfileDrawer;


