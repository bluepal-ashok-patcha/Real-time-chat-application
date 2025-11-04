import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../features/authSlice';
import { Box, TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = () => {
    setLoading(true);
    dispatch(login({ username, password }))
      .unwrap()
      .then(() => {
        navigate('/chat');
      })
      .catch((error) => {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f0f2f5',
      }}
    >
      <Paper sx={{ p: 4, width: 400, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h4" sx={{ mb: 2, color: '#4caf50' }}>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue to your chats.
        </Typography>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={handleLogin}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Button color="primary" onClick={() => navigate('/register')}>
            Register
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginForm;
