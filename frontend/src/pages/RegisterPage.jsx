import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, login } from '../features/authSlice';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import * as Yup from 'yup';
import { useFormik } from 'formik';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const registerSchema = Yup.object().shape({
    username: Yup.string().trim().required('Username is required'),
    email: Yup.string()
      .trim()
      .required('Email is required')
      .email('Enter a valid email address')
      .matches(/\.com$/i, 'Email must end with .com'),
    password: Yup.string()
      .required('Password is required')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      ),
    confirmPassword: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('password'), null], 'Passwords must match'),
  });

  const handleRegister = async (values) => {
    setLoading(true);
    setSubmitError('');
    try {
      await dispatch(register({ username: values.username, email: values.email, password: values.password })).unwrap();
      // Auto login after registration
      await dispatch(login({ username: values.username, password: values.password })).unwrap();
      navigate('/chat');
    } catch (error) {
      setSubmitError(error.message || 'Registration failed. Username or email may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: handleRegister,
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
                Join the conversation
              </Typography>
              <Typography sx={{ mt: 1.5, opacity: 0.85 }}>
                Create your account and start chatting instantly with friends, teammates, and communities.
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography sx={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>
                Why ChatApp
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
                • Organized conversations for private and group chats
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
                • Message status insights with real-time delivery info
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
                • Secure, reliable, and built for modern collaboration
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              backgroundColor: '#ffffff',
              p: { xs: 4, md: 6 },
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#075e54', mb: 1 }}>
              Create your account
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
              Fill out the details below to get started. We’ll automatically log you in once you’re set.
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
                label="Email"
                type="email"
                margin="normal"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                error={Boolean(formik.touched.email && formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
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
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                margin="normal"
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
              </Button>
            </Box>

            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 14 }}>
              <Box component={Link} to="/login" sx={{ color: '#128c7e', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Already have an account? Sign in
              </Box>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
