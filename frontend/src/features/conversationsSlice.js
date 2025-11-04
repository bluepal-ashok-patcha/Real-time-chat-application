import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchConversations = createAsyncThunk('conversations/fetchConversations', async () => {
  const response = await api.get('/chat/conversations');
  return response.data;
});

const initialState = {
  conversations: [],
  status: 'idle',
  error: null,
};

export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    updateConversation: (state, action) => {
      const newMessage = action.payload;
      const conversationId = newMessage.groupId ? newMessage.groupId : newMessage.sender.id;
      const conversationType = newMessage.groupId ? 'GROUP' : 'PRIVATE';
      const index = state.conversations.findIndex((c) => c.id === conversationId && c.type === conversationType);

      if (index !== -1) {
        // Conversation exists, update it
        state.conversations[index].lastMessage = newMessage.content;
        state.conversations[index].lastMessageTimestamp = newMessage.timestamp;
        state.conversations[index].unreadCount += 1;
      } else {
        // New conversation
        state.conversations.push({
          id: conversationId,
          name: conversationType === 'GROUP' ? 'New Group' : newMessage.sender.username,
          type: conversationType,
          lastMessage: newMessage.content,
          lastMessageTimestamp: newMessage.timestamp,
          unreadCount: 1,
          profilePictureUrl: conversationType === 'PRIVATE' ? newMessage.sender.profilePictureUrl : null,
        });
      }

      // Sort conversations
      state.conversations.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { updateConversation } = conversationsSlice.actions;

export default conversationsSlice.reducer;
