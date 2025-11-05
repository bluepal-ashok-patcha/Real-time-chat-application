import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { fetchUserProfile } from './features/authSlice';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MessagingApp from './pages/MessagingApp';
import './index.css';

function App() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // On mount, if a token exists but user not in store, fetch profile and block routing until done
    const storedToken = localStorage.getItem('token');
    if (storedToken && !user) {
      dispatch(fetchUserProfile())
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, [dispatch, user]);

  if (checkingAuth) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isAuthenticated = Boolean(user && user.id);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" /> : <RegisterPage />} />
        <Route path="/chat" element={isAuthenticated ? <MessagingApp /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/chat' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
