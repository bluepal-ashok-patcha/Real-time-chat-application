import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchMessages = createAsyncThunk('messages/fetchMessages', async ({ userId, contactId }) => {
  const response = await api.get(`/chat/messages/${userId}/${contactId}`);
  return response.data.content;
});

export const sendMessage = createAsyncThunk('messages/sendMessage', async ({ receiverId, content }) => {
  const response = await api.post('/chat/messages', { receiver: { id: receiverId }, content });
  return response.data;
});

const initialState = {
  messages: [],
  status: 'idle',
  error: null,
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      });
  },
});

export const { addMessage } = messagesSlice.actions;

export default messagesSlice.reducer;
