import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Container } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, fetchUserProfile } from '../features/authSlice';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await dispatch(login({ username, password })).unwrap();
      await dispatch(fetchUserProfile()).unwrap();
      navigate('/chat');
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  return (
    <Box className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <Container maxWidth="sm">
        <Paper elevation={3} className="p-8">
          <Box className="flex flex-col items-center mb-6">
            <WhatsAppIcon sx={{ fontSize: 60, color: '#25d366', mb: 2 }} />
            <Typography variant="h4" className="font-semibold text-gray-800 mb-2">
              WhatsApp Web
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Sign in to continue
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              required
            />

            {error && (
              <Typography className="text-red-500 text-sm mt-2">{error}</Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="mt-4 bg-[#25d366] hover:bg-[#20ba5a]"
              disabled={loading}
              sx={{
                backgroundColor: '#25d366',
                '&:hover': { backgroundColor: '#20ba5a' },
                py: 1.5,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box className="mt-4 text-center">
              <Link to="/register" className="text-[#25d366] hover:underline">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
