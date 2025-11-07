import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, fetchUserProfile } from '../features/authSlice';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import * as Yup from 'yup';
import { useFormik } from 'formik';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginSchema = Yup.object().shape({
    username: Yup.string().trim().required('Username is required'),
    // password: Yup.string()
    //   .required('Password is required')
    //   .matches(
    //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    //     'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    //   ),
  });

  const handleLogin = async (values) => {
    setLoading(true);
    setSubmitError('');
    try {
      await dispatch(login(values)).unwrap();
      await dispatch(fetchUserProfile()).unwrap();
      navigate('/chat');
    } catch (error) {
      setSubmitError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: handleLogin,
    validateOnBlur: true,
    validateOnChange: false,
  });

  return (
    <Box
      className="min-h-screen"
      sx={{
        background: 'linear-gradient(135deg, #075e54 0%, #0a6b5c 40%, #0b443a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 8 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 900,
          borderRadius: 4,
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box
            sx={{
              flex: { xs: 'unset', md: '0 0 40%' },
              background: 'linear-gradient(160deg, rgba(7,94,84,0.95) 0%, rgba(7,94,84,0.85) 100%)',
              color: '#fff',
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <Box>
              <WhatsAppIcon sx={{ fontSize: 52, color: '#d9fdd3' }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 3 }}>
                Welcome back!
              </Typography>
              <Typography sx={{ mt: 1.5, opacity: 0.85 }}>
                Log in to continue your conversations and stay connected with your contacts in real time.
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography sx={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>
                Highlights
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, opacity: 0.9 }}>
                • Real-time messaging powered by WebSockets
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, opacity: 0.9 }}>
                • Secure authentication with JWT tokens
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, opacity: 0.9 }}>
                • Redis-backed presence indicators and last seen
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              backgroundColor: '#ffffff',
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#075e54', mb: 1 }}>
              Sign in
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
              Enter your credentials to access your messages and contacts.
            </Typography>

            <Box component="form" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                margin="normal"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                autoFocus
                required
                error={Boolean(formik.touched.username && formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                error={Boolean(formik.touched.password && formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />

              {submitError && (
                <Typography sx={{ color: '#d32f2f', fontSize: 13, mt: 1 }}>{submitError}</Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 4,
                  py: 1.6,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #25d366 0%, #20ba5a 100%)',
                  boxShadow: '0 8px 18px rgba(37, 211, 102, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #20ba5a 0%, #1aa24d 100%)',
                    boxShadow: '0 10px 22px rgba(37, 211, 102, 0.28)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 14 }}>
              <Box component={Link} to="/register" sx={{ color: '#128c7e', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Don't have an account? Create one
              </Box>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
