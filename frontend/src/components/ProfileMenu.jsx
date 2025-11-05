import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import { Person, Logout, Edit } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../features/authSlice';

const ProfileMenu = ({ anchorEl, onClose, onLogout }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  const [about, setAbout] = useState(user?.about || '');

  const handleOpenProfile = () => {
    setProfilePictureUrl(user?.profilePictureUrl || '');
    setAbout(user?.about || '');
    setProfileDialogOpen(true);
    onClose();
  };

  const handleUpdateProfile = async () => {
    try {
      await dispatch(updateProfile({ profilePictureUrl, about })).unwrap();
      setProfileDialogOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
        <MenuItem onClick={handleOpenProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={onLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Profile</DialogTitle>
        <DialogContent>
          <Box className="flex flex-col items-center mb-4">
            <Avatar src={profilePictureUrl} className="w-24 h-24 mb-2">
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6">{user?.username}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>

          <TextField
            fullWidth
            label="Profile Picture URL"
            value={profilePictureUrl}
            onChange={(e) => setProfilePictureUrl(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="About"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Tell us about yourself"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileMenu;

