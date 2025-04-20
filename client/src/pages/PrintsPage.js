import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { getPrints, searchPrints, deletePrint, updatePrint } from '../services/api';
import PrintCard from '../components/PrintCard';

const PrintsPage = () => {
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editPrint, setEditPrint] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Handler for editing a print (open modal)
  const handleEdit = (print) => {
    setEditPrint({ ...print });
    setEditOpen(true);
    setEditError('');
  };

  // Handler for submitting the edit
  const handleEditSubmit = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      await updatePrint(editPrint.id, editPrint);
      setPrints((prev) => prev.map(p => p.id === editPrint.id ? editPrint : p));
      setEditOpen(false);
    } catch (err) {
      setEditError('Failed to update print.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handler for closing the edit modal
  const handleEditClose = () => {
    setEditOpen(false);
    setEditPrint(null);
    setEditError('');
  };

  // Handler for deleting a print
  const handleDelete = async (printId) => {
    if (!window.confirm('Are you sure you want to delete this print?')) return;
    try {
      await deletePrint(printId);
      setPrints((prev) => prev.filter(p => p.id !== printId));
    } catch (err) {
      alert('Failed to delete print.');
    }
  };

  const [prints, setPrints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const loadPrints = async (query = '') => {
    try {
      setLoading(true);
      const response = await (query ? searchPrints(query) : getPrints());
      setPrints(response.data);
    } catch (err) {
      setError('Failed to load prints');
      console.error('Error loading prints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrints();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(() => {
        loadPrints(query);
      }, 500)
    );
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Prints
        </Typography>

        <TextField
          label="Search Prints"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      
      
      <Grid container spacing={3}>
        
        {Array.isArray(prints) && prints.length > 0
          ? prints.map((print, idx) => {
  if (typeof print !== 'object' || print === null || !print.id) {
    console.log('NON-OBJECT IN PRINTS:', print, idx);
    return null;
  }
  return (
    <Grid item xs={12} sm={6} md={4} key={print.id || idx}>
      <PrintCard print={print} onEdit={handleEdit} onDelete={handleDelete} />
    </Grid>
  );
})
          : (
            <Grid item xs={12}>
              <Alert severity="info">
                No prints found{searchQuery ? ' matching your search' : ''}.
              </Alert>
            </Grid>
          )}
        
      </Grid>
    {/* Edit Print Modal */}
    <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Print</DialogTitle>
      <DialogContent>
        {editError && <Alert severity="error">{editError}</Alert>}
        {editPrint && (
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={editPrint.name}
              onChange={e => setEditPrint({ ...editPrint, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="URL"
              value={editPrint.url || ''}
              onChange={e => setEditPrint({ ...editPrint, url: e.target.value })}
              fullWidth
            />
            <TextField
              label="Quantity Available"
              type="number"
              value={editPrint.quantityAvailable}
              onChange={e => setEditPrint({ ...editPrint, quantityAvailable: Number(e.target.value) })}
              fullWidth
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleEditClose} disabled={editLoading}>Cancel</Button>
        <Button onClick={handleEditSubmit} disabled={editLoading} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  </Container>
  );
};

export default PrintsPage;
