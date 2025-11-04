import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const CreateGroupModal = ({ open, handleClose, handleCreateGroup }) => {
  const [groupName, setGroupName] = useState('');

  const onCreate = () => {
    if (groupName.trim()) {
      handleCreateGroup(groupName);
      setGroupName('');
      handleClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Create a new group
        </Typography>
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          variant="outlined"
          sx={{ mt: 2, mb: 2 }}
        />
        <Button variant="contained" onClick={onCreate}>
          Create
        </Button>
      </Box>
    </Modal>
  );
};

export default CreateGroupModal;
