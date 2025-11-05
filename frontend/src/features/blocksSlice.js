import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchBlockedUsers = createAsyncThunk('blocks/fetchBlockedUsers', async (page = 0, size = 100) => {
  const response = await api.get(`/blocks?page=${page}&size=${size}`);
  return response.data.content || [];
});

export const blockUser = createAsyncThunk('blocks/blockUser', async (blockedUserId) => {
  const response = await api.post(`/blocks/${blockedUserId}`);
  return response.data;
});

export const unblockUser = createAsyncThunk('blocks/unblockUser', async (blockedUserId) => {
  await api.delete(`/blocks/${blockedUserId}`);
  return blockedUserId;
});

const initialState = {
  blockedUsers: [],
  status: 'idle',
  error: null,
};

export const blocksSlice = createSlice({
  name: 'blocks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlockedUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.blockedUsers = action.payload;
      })
      .addCase(fetchBlockedUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        if (!state.blockedUsers.find((b) => b.blockedUser.id === action.payload.blockedUser.id)) {
          state.blockedUsers.push(action.payload);
        }
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter((b) => b.blockedUser.id !== action.payload);
      });
  },
});

export default blocksSlice.reducer;

