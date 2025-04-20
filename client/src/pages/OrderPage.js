import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Button,
} from '@mui/material';
import { getPrints } from '../services/api';
import OrderForm from '../components/OrderForm';

const OrderPage = () => {
  const { printId } = useParams();
  const navigate = useNavigate();
  const [print, setPrint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    const loadPrint = async () => {
      try {
        const response = await getPrints();
        const foundPrint = response.data.find(p => p.id === parseInt(printId, 10));
        if (!foundPrint) {
          throw new Error('Print not found');
        }
        setPrint(foundPrint);
      } catch (err) {
        setError(err.message);
        console.error('Error loading print:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrint();
  }, [printId]);

  const handleOrderClose = (success) => {
    if (success) {
      navigate('/orders');
    } else {
      setShowForm(false);
      navigate('/prints');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !print) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Print not found'}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/prints')}
            fullWidth
          >
            Back to Prints
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!print.quantityAvailable) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {print.name}
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This print is currently not available.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/prints')}
            fullWidth
          >
            Back to Prints
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Print: {print.name}
      </Typography>

      {showForm && (
        <OrderForm
          open={true}
          onClose={handleOrderClose}
          print={print}
        />
      )}
    </Container>
  );
};

export default OrderPage;
