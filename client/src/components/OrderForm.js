import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { createOrder, updateOrder } from '../services/api';

const OrderForm = ({ open, onClose, print, existingOrder = null }) => {
  const [formData, setFormData] = useState({
    quantity: existingOrder?.quantity || 1,
    description: existingOrder?.description || '',
    photosLink: existingOrder?.photosLink || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // When editing, allow up to (available + their current order quantity)
      const maxQuantity = existingOrder
        ? print.quantityAvailable + existingOrder.quantity
        : print.quantityAvailable;
      if (formData.quantity > maxQuantity) {
        throw new Error(`Not enough quantity available. Max allowed: ${maxQuantity}`);
      }

      const orderData = {
        printId: print.id,
        ...formData,
      };

      if (existingOrder) {
        await updateOrder(existingOrder.id, orderData);
      } else {
        await createOrder(orderData);
      }

      onClose(true); // true indicates successful submission
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {existingOrder ? 'Edit Order' : 'New Order'}: {print.name}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available Quantity: {print.quantityAvailable}
            </Typography>
          </Box>

          <TextField
            name="quantity"
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{
              min: 1,
              max: existingOrder
                ? print.quantityAvailable + existingOrder.quantity
                : print.quantityAvailable
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            name="description"
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* Only show Google Photos Link input if print.code is not present */}
          {!(print.code) && (
            <TextField
              name="photosLink"
              label="Google Photos Link"
              value={formData.photosLink}
              onChange={handleChange}
              fullWidth
              required
              placeholder="https://photos.google.com/..."
            />
          )}
          {/* If print.code exists, show a message instead */}
          {print.code && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No Google Photos link required for this print. A code will be shown in your Orders tab after ordering.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose(false)}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : existingOrder ? 'Update Order' : 'Place Order'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OrderForm;
