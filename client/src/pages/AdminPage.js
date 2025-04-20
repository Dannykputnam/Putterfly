import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  TextField,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import {
  getAllOrders,
  updateOrderStatus,
  uploadPrints,
  getSettings,
  updateAnnouncement,
  updateHowToUse,
  getUserCount,
} from '../services/api';

import { deleteAllOrders, deleteAllPrints } from '../services/api';

const AdminPage = () => {
  // ...existing state
  const [deleteAllMsg, setDeleteAllMsg] = useState('');
  const [deleteAllMsgType, setDeleteAllMsgType] = useState('success');

  // ...existing code

  const handleDeleteAllOrders = async () => {
    if (!window.confirm('Are you sure you want to delete ALL orders? This cannot be undone.')) return;
    try {
      await deleteAllOrders();
      setDeleteAllMsg('All orders have been deleted.');
      setDeleteAllMsgType('success');
      loadData();
    } catch (err) {
      setDeleteAllMsg('Failed to delete all orders.');
      setDeleteAllMsgType('error');
    }
  };

  const handleDeleteAllPrints = async () => {
    if (!window.confirm('Are you sure you want to delete ALL prints? This cannot be undone.')) return;
    try {
      await deleteAllPrints();
      setDeleteAllMsg('All prints have been deleted.');
      setDeleteAllMsgType('success');
      loadData();
    } catch (err) {
      setDeleteAllMsg('Failed to delete all prints.');
      setDeleteAllMsgType('error');
    }
  };

  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [settings, setSettings] = useState({
    announcement_header: '',
    how_to_use: '',
  });
  const [userCount, setUserCount] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, settingsRes, userCountRes] = await Promise.all([
        getAllOrders(),
        getSettings(),
        getUserCount(),
      ]);
      // Sort so that 'pending' orders appear first
      const sortedOrders = [...ordersRes.data].sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === 'pending') return -1;
        if (b.status === 'pending') return 1;
        return 0;
      });
      setOrders(sortedOrders);
      setSettings(settingsRes.data);
      setUserCount(userCountRes.data.count);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
    setUploadSuccess('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file');
      setUploadSuccess('');
      return;
    }
    try {
      await uploadPrints(uploadFile);
      setUploadFile(null);
      setUploadSuccess('Prints uploaded successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload prints');
      setUploadSuccess('');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order status:', err);
    }
  };

  const handleSettingsUpdate = async (type) => {
    try {
      if (type === 'announcement') {
        await updateAnnouncement(settings.announcement_header);
      } else {
        await updateHowToUse(settings.how_to_use);
      }
      setError('');
    } catch (err) {
      setError('Failed to update ' + type);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Announcement Header - ensure black text */}
      {settings.announcement_header && (
        <Typography variant="h5" sx={{ color: 'black', my: 2 }}>
          {settings.announcement_header}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Orders" />
          <Tab label="Upload Prints" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            All Orders
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Print</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ordered On</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell>Google Photos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell>{order.printName}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          bgcolor: order.status === 'ordered' ? 'success.light' : 'warning.light',
                          color: order.status === 'ordered' ? 'success.dark' : 'warning.dark',
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          display: 'inline-block',
                        }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      {order.status === 'pending' && (
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleStatusUpdate(order.id, 'ordered')}
                        >
                          Mark as Ordered
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.photosLink ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => window.open(order.photosLink, '_blank', 'noopener,noreferrer')}
                        >
                          Google Photos
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Upload Prints from Excel
          </Typography>
          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>{uploadSuccess}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleFileUpload}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Choose Excel File
                </Button>
              </label>
              {uploadFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Selected file: {uploadFile.name}
                  </Typography>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1 }}
                  >
                    Upload
                  </Button>
                </Box>
              )}
            </form>
          </Paper>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            App Settings
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Announcement Header
              </Typography>
              <TextField
                fullWidth
                value={settings.announcement_header}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    announcement_header: e.target.value,
                  }))
                }
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={() => handleSettingsUpdate('announcement')}
              >
                Update Announcement
              </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                How to Use Text
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={settings.how_to_use}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    how_to_use: e.target.value,
                  }))
                }
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={() => handleSettingsUpdate('how-to-use')}
              >
                Update How to Use
              </Button>
            </Box>

            <Box>
              <Typography variant="subtitle1">
                Registered Users: {userCount}
              </Typography>
            </Box>

            {/* Destructive admin actions */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" color="error" gutterBottom>
                Danger Zone
              </Typography>
              <Button
                variant="contained"
                color="error"
                sx={{ mr: 2, mb: 2 }}
                onClick={handleDeleteAllOrders}
              >
                Delete All Orders
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ mb: 2 }}
                onClick={handleDeleteAllPrints}
              >
                Delete All Prints
              </Button>
              {deleteAllMsg && (
                <Alert severity={deleteAllMsgType} sx={{ mt: 2 }}>{deleteAllMsg}</Alert>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default AdminPage;
