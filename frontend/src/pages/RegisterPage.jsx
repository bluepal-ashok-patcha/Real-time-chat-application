import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Container } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, login } from '../features/authSlice';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await dispatch(register({ username, email, password })).unwrap();
      // Auto login after registration
      await dispatch(login({ username, password })).unwrap();
      navigate('/chat');
    } catch (error) {
      setError(error.message || 'Registration failed. Username or email may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRegister(e);
    }
  };

  return (
    <Box className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <Container maxWidth="sm">
        <Paper elevation={3} className="p-8">
          <Box className="flex flex-col items-center mb-6">
            <WhatsAppIcon sx={{ fontSize: 60, color: '#25d366', mb: 2 }} />
            <Typography variant="h4" className="font-semibold text-gray-800 mb-2">
              Create Account
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Sign up to get started
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleRegister}>
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
              label="Email"
              type="email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
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
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
            </Button>

            <Box className="mt-4 text-center">
              <Link to="/login" className="text-[#25d366] hover:underline">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
