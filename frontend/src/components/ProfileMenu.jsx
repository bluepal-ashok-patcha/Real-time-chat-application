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

const ProfileMenu = ({ anchorEl, onClose, onLogout, onOpenProfileDrawer }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const handleOpenProfile = () => {
    onClose();
    onOpenProfileDrawer?.();
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

      {/* Drawer handled by parent */}
    </>
  );
};

export default ProfileMenu;

