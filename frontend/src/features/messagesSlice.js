import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ userId1, userId2, page = 0, size = 50 }) => {
    const response = await api.get(`/chat/messages/${userId1}/${userId2}?page=${page}&size=${size}`);
    return { messages: response.data.content || [], hasMore: !response.data.last };
  }
);

export const fetchGroupMessages = createAsyncThunk(
  'messages/fetchGroupMessages',
  async ({ groupId, page = 0, size = 50 }) => {
    const response = await api.get(`/chat/messages/${groupId}?page=${page}&size=${size}`);
    return { messages: response.data.content || [], hasMore: !response.data.last };
  }
);

export const sendMessage = createAsyncThunk('messages/sendMessage', async ({ receiverId, groupId, content }) => {
  const messageData = groupId ? { groupId, content } : { receiver: { id: receiverId }, content };
  const response = await api.post('/chat/messages', messageData);
  return response.data;
});

export const markMessageAsRead = createAsyncThunk('messages/markMessageAsRead', async (messageId) => {
  await api.post(`/chat/messages/${messageId}/read`);
  return messageId;
});

export const getMessageInfo = createAsyncThunk('messages/getMessageInfo', async (messageId) => {
  const response = await api.get(`/chat/messages/${messageId}/info`);
  return response.data;
});

const initialState = {
  messages: {},
  currentChat: null, // { type: 'PRIVATE' | 'GROUP', id: userId or groupId }
  status: 'idle',
  error: null,
  typing: {}, // { userId/groupId: { username, typing: boolean } }
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      const chatKey = message.groupId ? `group_${message.groupId}` : `private_${message.sender.id}_${message.receiver?.id}`;
      
      if (!state.messages[chatKey]) {
        state.messages[chatKey] = [];
      }
      
      // Check if message already exists
      if (!state.messages[chatKey].find((m) => m.id === message.id)) {
        state.messages[chatKey].push(message);
        // Sort by timestamp
        state.messages[chatKey].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    clearMessages: (state) => {
      state.messages = {};
      state.currentChat = null;
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      Object.keys(state.messages).forEach((key) => {
        const message = state.messages[key].find((m) => m.id === messageId);
        if (message) {
          message.status = status;
        }
      });
    },
    setTyping: (state, action) => {
      const { userId, groupId, username, typing } = action.payload;
      const key = groupId ? `group_${groupId}` : `user_${userId}`;
      if (typing) {
        state.typing[key] = { username, typing };
      } else {
        delete state.typing[key];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { userId1, userId2 } = action.meta.arg;
        const chatKey = `private_${userId1}_${userId2}`;
        state.messages[chatKey] = action.payload.messages;
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        const { groupId } = action.meta.arg;
        const chatKey = `group_${groupId}`;
        state.messages[chatKey] = action.payload.messages;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatKey = message.groupId
          ? `group_${message.groupId}`
          : `private_${message.sender.id}_${message.receiver?.id}`;
        
        if (!state.messages[chatKey]) {
          state.messages[chatKey] = [];
        }
        
        if (!state.messages[chatKey].find((m) => m.id === message.id)) {
          state.messages[chatKey].push(message);
          state.messages[chatKey].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const messageId = action.payload;
        Object.keys(state.messages).forEach((key) => {
          const message = state.messages[key].find((m) => m.id === messageId);
          if (message) {
            message.status = 'READ';
          }
        });
      });
  },
});

export const { addMessage, setCurrentChat, clearMessages, updateMessageStatus, setTyping } = messagesSlice.actions;

export default messagesSlice.reducer;
