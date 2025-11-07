import React, { useState } from 'react';
import { Dialog, Box, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

const ImagePreviewDialog = ({ open, onClose, src, title }) => {
  const [scale, setScale] = useState(1);

  if (!src) return null;

  const handleWheel = (e) => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(Math.max(prev + zoom, 0.5), 2)); // zoom between 0.5x and 2x
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          backgroundColor: 'black',
          boxShadow: 'none',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '90vh',
          backgroundColor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        onWheel={handleWheel}
      >
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: 'white',
            zIndex: 2,
            backgroundColor: 'rgba(0,0,0,0.4)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
          }}
        >
          <Close />
        </IconButton>

        {/* Title (optional) */}
        {title && (
          <Typography
            variant="subtitle2"
            sx={{
              position: 'absolute',
              top: 14,
              left: 16,
              color: 'white',
              zIndex: 2,
              opacity: 0.9,
            }}
          >
            {title}
          </Typography>
        )}

        {/* Image */}
        <Box
          sx={{
            transition: 'transform 0.2s ease',
            transform: `scale(${scale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <img
            src={src}
            alt={title || 'preview'}
            style={{
              objectFit: 'contain',
              width: 'auto',
              height: '80vh',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
        </Box>
      </Box>
    </Dialog>
  );
};

export default ImagePreviewDialog;
