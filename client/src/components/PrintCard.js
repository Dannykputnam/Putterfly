import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrintCard = ({ print, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  return (
  <Card>
    <CardContent>
      <Typography gutterBottom variant="h6" component="div">
        {print.name}
      </Typography>
      {print.url && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <a href={print.url} target="_blank" rel="noopener noreferrer">
            View Reference
          </a>
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>
        <Chip
          label={print.quantityAvailable > 0 ? `${print.quantityAvailable} Available` : 'Not Available'}
          color={print.quantityAvailable > 0 ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>
    </CardContent>
    {typeof print.quantityAvailable === 'number' && (
      <CardActions>
        {print.quantityAvailable > 0 ? (
          <Button
            component={Link}
            to={`/order/${print.id}`}
            size="small"
            color="primary"
            variant="contained"
            fullWidth
          >
            Order Print
          </Button>
        ) : (
          <Button
            size="small"
            color="error"
            disabled
            fullWidth
          >
            Currently Not Available
          </Button>
        )}
      </CardActions>
    )}
    {isAdmin && (
      <CardActions sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Button size="small" color="primary" onClick={() => { if (onEdit) onEdit(print); }}>
          Edit
        </Button>
        <Button size="small" color="error" onClick={() => { if (onDelete) onDelete(print.id); }}>
          Delete
        </Button>
      </CardActions>
    )}
  </Card>
);
};

export default PrintCard;
