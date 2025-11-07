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
  pagination: {}, // { chatKey: { page: number, hasMore: boolean, loading: boolean } }
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      // Normalize chatKey for private messages to ensure consistent key regardless of sender/receiver order
      let chatKey;
      if (message.groupId) {
        chatKey = `group_${message.groupId}`;
      } else {
        // Sort IDs to ensure consistent key (e.g., private_1_2 and private_2_1 both become private_1_2)
        const userIds = [message.sender.id, message.receiver?.id].filter(Boolean).sort((a, b) => a - b);
        chatKey = `private_${userIds[0]}_${userIds[1]}`;
      }
      
      if (!state.messages[chatKey]) {
        state.messages[chatKey] = [];
      }
      
      // Check if message already exists - skip if already present
      if (!state.messages[chatKey].find((m) => m.id === message.id)) {
        // Ensure timestamp is valid - if missing or invalid, use current time
        let messageTime = message.timestamp ? new Date(message.timestamp).getTime() : null;
        if (!messageTime || isNaN(messageTime)) {
          messageTime = Date.now();
        }
        
        // Normalize timestamp to ISO string if it's missing
        const normalizedMessage = {
          ...message,
          timestamp: message.timestamp || new Date(messageTime).toISOString()
        };
        
        state.messages[chatKey].push(normalizedMessage);
        
        // Sort by timestamp (ascending - oldest first, newest last)
        state.messages[chatKey].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Date.now();
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Date.now();
          // If timestamps are equal, sort by ID to ensure stable sort
          if (timeA === timeB) {
            return (a.id || 0) - (b.id || 0);
          }
          return timeA - timeB;
        });
      }
    },
    addMessageWithKey: (state, action) => {
      const { chatKey, message } = action.payload;
      if (!chatKey || !message) return;
      if (!state.messages[chatKey]) {
        state.messages[chatKey] = [];
      }
      if (!state.messages[chatKey].find((m) => m.id === message.id)) {
        let messageTime = message.timestamp ? new Date(message.timestamp).getTime() : null;
        if (!messageTime || isNaN(messageTime)) {
          messageTime = Date.now();
        }
        const normalizedMessage = {
          ...message,
          timestamp: message.timestamp || new Date(messageTime).toISOString(),
        };
        state.messages[chatKey].push(normalizedMessage);
        state.messages[chatKey].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Date.now();
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Date.now();
          if (timeA === timeB) {
            return (a.id || 0) - (b.id || 0);
          }
          return timeA - timeB;
        });
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
      .addCase(fetchMessages.pending, (state, action) => {
        state.status = 'loading';
        const { userId1, userId2 } = action.meta.arg;
        const userIds = [userId1, userId2].filter(Boolean).sort((a, b) => a - b);
        const chatKey = `private_${userIds[0]}_${userIds[1]}`;
        if (!state.pagination[chatKey]) {
          state.pagination[chatKey] = { page: 0, hasMore: true, loading: false };
        }
        state.pagination[chatKey].loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { userId1, userId2, page = 0 } = action.meta.arg;
        const userIds = [userId1, userId2].filter(Boolean).sort((a, b) => a - b);
        const chatKey = `private_${userIds[0]}_${userIds[1]}`;
        const incoming = action.payload.messages || [];
        // Backend returns DESC (newest first), reverse for display (oldest first)
        const reversed = [...incoming].reverse();
        if (page === 0) {
          // First load: replace all
          state.messages[chatKey] = reversed;
        } else {
          // Load more: prepend older messages
          const existing = state.messages[chatKey] || [];
          state.messages[chatKey] = [...reversed, ...existing];
        }
        if (!state.pagination[chatKey]) {
          state.pagination[chatKey] = { page: 0, hasMore: true, loading: false };
        }
        state.pagination[chatKey].page = page;
        state.pagination[chatKey].hasMore = action.payload.hasMore;
        state.pagination[chatKey].loading = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        const { userId1, userId2 } = action.meta.arg;
        const userIds = [userId1, userId2].filter(Boolean).sort((a, b) => a - b);
        const chatKey = `private_${userIds[0]}_${userIds[1]}`;
        if (state.pagination[chatKey]) {
          state.pagination[chatKey].loading = false;
        }
      })
      .addCase(fetchGroupMessages.pending, (state, action) => {
        const { groupId } = action.meta.arg;
        const chatKey = `group_${groupId}`;
        if (!state.pagination[chatKey]) {
          state.pagination[chatKey] = { page: 0, hasMore: true, loading: false };
        }
        state.pagination[chatKey].loading = true;
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        const { groupId, page = 0 } = action.meta.arg;
        const chatKey = `group_${groupId}`;
        const incoming = action.payload.messages || [];
        const reversed = [...incoming].reverse();
        if (page === 0) {
          state.messages[chatKey] = reversed;
        } else {
          const existing = state.messages[chatKey] || [];
          state.messages[chatKey] = [...reversed, ...existing];
        }
        if (!state.pagination[chatKey]) {
          state.pagination[chatKey] = { page: 0, hasMore: true, loading: false };
        }
        state.pagination[chatKey].page = page;
        state.pagination[chatKey].hasMore = action.payload.hasMore;
        state.pagination[chatKey].loading = false;
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        const { groupId } = action.meta.arg;
        const chatKey = `group_${groupId}`;
        if (state.pagination[chatKey]) {
          state.pagination[chatKey].loading = false;
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        // Normalize chatKey for private messages to ensure consistent key regardless of sender/receiver order
        let chatKey;
        if (message.groupId) {
          chatKey = `group_${message.groupId}`;
        } else {
          // Sort IDs to ensure consistent key (e.g., private_1_2 and private_2_1 both become private_1_2)
          const userIds = [message.sender.id, message.receiver?.id].filter(Boolean).sort((a, b) => a - b);
          chatKey = `private_${userIds[0]}_${userIds[1]}`;
        }
        
        if (!state.messages[chatKey]) {
          state.messages[chatKey] = [];
        }
        
        // Check if message already exists - skip if already present
        if (!state.messages[chatKey].find((m) => m.id === message.id)) {
          // Ensure timestamp is valid - if missing or invalid, use current time
          let messageTime = message.timestamp ? new Date(message.timestamp).getTime() : null;
          if (!messageTime || isNaN(messageTime)) {
            messageTime = Date.now();
          }
          
          // Normalize timestamp to ISO string if it's missing
          const normalizedMessage = {
            ...message,
            timestamp: message.timestamp || new Date(messageTime).toISOString()
          };
          
          state.messages[chatKey].push(normalizedMessage);
          
          // Sort by timestamp (ascending - oldest first, newest last)
          state.messages[chatKey].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Date.now();
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Date.now();
            // If timestamps are equal, sort by ID to ensure stable sort
            if (timeA === timeB) {
              return (a.id || 0) - (b.id || 0);
            }
            return timeA - timeB;
          });
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

export const { addMessage, addMessageWithKey, setCurrentChat, clearMessages, updateMessageStatus, setTyping } = messagesSlice.actions;

export default messagesSlice.reducer;
