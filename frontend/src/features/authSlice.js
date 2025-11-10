import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const register = createAsyncThunk('auth/register', async ({ username, email, password,phoneNumber }) => {
  const response = await api.post('/auth/register', { username, email, password ,phoneNumber});
  return response.data;
});

export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
  const response = await api.post('/auth/login', { username, password });
  localStorage.setItem('token', response.data.token);
  return response.data.token;
});

export const fetchUserProfile = createAsyncThunk('auth/fetchUserProfile', async () => {
  const response = await api.get('/auth/profile');
  return response.data;
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async ({ profilePictureUrl, about }) => {
  const response = await api.put('/auth/profile', { profilePictureUrl, about });
  return response.data;
});

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  status: 'idle',
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = 'succeeded';
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.status = 'failed';
        localStorage.removeItem('token');
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, setUser } = authSlice.actions;

export default authSlice.reducer;
