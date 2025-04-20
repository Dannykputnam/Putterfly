import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { getOrders, deleteOrder, getPrints } from '../services/api';
import OrderForm from '../components/OrderForm';
import { useAuth } from '../context/AuthContext';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [prints, setPrints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOrder, setEditOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { user } = useAuth();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Fetch prints as well
    getPrints().then(res => setPrints(res.data)).catch(() => setPrints([]));
  }, []);

  const handleEdit = (order) => {
    setEditOrder(order);
  };

  const handleEditClose = (shouldRefresh) => {
    setEditOrder(null);
    if (shouldRefresh) {
      loadOrders();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteOrder(deleteConfirm.id);
      setDeleteConfirm(null);
      loadOrders();
    } catch (err) {
      setError('Failed to delete order');
      console.error('Error deleting order:', err);
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
        My Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Print Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ordered On</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell>Google Photos</TableCell>
              <TableCell>Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
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
    <>
      <Button
        size="small"
        onClick={() => handleEdit(order)}
        sx={{ mr: 1 }}
      >
        Edit
      </Button>
      <Button
        size="small"
        color="error"
        onClick={() => setDeleteConfirm(order)}
      >
        Delete
      </Button>
    </>
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
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!order.printCode}
                      onClick={() => order.printCode && navigator.clipboard.writeText(order.printCode)}
                    >
                      {order.printCode ? 'Copy' : 'No Code'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {editOrder && (
        <OrderForm
          open={true}
          onClose={handleEditClose}
          print={(() => {
            const found = prints.find(p => p.id === editOrder.printId);
            return {
              name: editOrder.printName,
              quantityAvailable: found ? found.quantityAvailable : 0,
              id: editOrder.printId
            };
          })()}
          existingOrder={editOrder}
        />
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this order?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersPage;
