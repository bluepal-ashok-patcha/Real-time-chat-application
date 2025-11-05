import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchStatus = createAsyncThunk('status/fetchStatus', async (userIds) => {
  const response = await api.post('/users/status', { userIds });
  return response.data.status;
});

export const fetchOnlineUsers = createAsyncThunk('status/fetchOnlineUsers', async () => {
  const response = await api.get('/chat/users/online');
  return response.data;
});

const initialState = {
  userStatus: {}, // userId -> "online" or timestamp
  onlineUsers: [],
  status: 'idle',
  error: null,
};

export const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    updateOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.userStatus[userId] = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userStatus = { ...state.userStatus, ...action.payload };
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchOnlineUsers.fulfilled, (state, action) => {
        state.onlineUsers = action.payload;
      });
  },
});

export const { updateOnlineUsers, updateUserStatus } = statusSlice.actions;

export default statusSlice.reducer;

