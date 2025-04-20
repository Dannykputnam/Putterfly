import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';

const ProfilePage = () => {
  const { user, login: updateAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name,
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        ...(formData.currentPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      };

      const response = await updateUserProfile(updateData);
      updateAuth(response.data.token, response.data.user);
      setSuccess('Profile updated successfully');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Change Password (optional)
          </Typography>

          <TextField
            name="currentPassword"
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <TextField
            name="newPassword"
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <TextField
            name="confirmNewPassword"
            label="Confirm New Password"
            type="password"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
