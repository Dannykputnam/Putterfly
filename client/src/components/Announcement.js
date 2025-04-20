import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { getSettings } from '../services/api';

const Announcement = () => {
  const [settings, setSettings] = useState({
    announcement_header: '',
    how_to_use: '',
  });
  const [openHowTo, setOpenHowTo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then(response => {
        setSettings(response.data);
      })
      .catch(error => {
        setError('Failed to load announcement');
        console.error('Error loading settings:', error);
      });
  }, []);

  const handleOpenHowTo = () => {
    setOpenHowTo(true);
  };

  const handleCloseHowTo = () => {
    setOpenHowTo(false);
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ py: 2, px: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ color: 'black' }}>
          {settings.announcement_header}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleOpenHowTo}
          sx={{ ml: 2 }}
        >
          How to Use
        </Button>
      </Box>

      <Dialog
        open={openHowTo}
        onClose={handleCloseHowTo}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>How to Use the Print Catalog App</DialogTitle>
        <DialogContent>
          <Typography>
            {settings.how_to_use}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHowTo}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Announcement;
