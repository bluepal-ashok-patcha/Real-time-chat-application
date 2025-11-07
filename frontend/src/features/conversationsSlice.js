import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchConversations = createAsyncThunk('conversations/fetchConversations', async () => {
  const response = await api.get('/chat/conversations');
  return response.data || [];
});

const initialState = {
  conversations: [],
  status: 'idle',
  error: null,
  currentUserId: null, // used to avoid counting sender's own messages as unread
};

export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
    setConversationImage: (state, action) => {
      const { id, type, imageUrl } = action.payload;
      const idx = state.conversations.findIndex((c) => c.id === id && c.type === type);
      if (idx !== -1) {
        state.conversations[idx].profilePictureUrl = imageUrl;
      }
    },
    updateConversation: (state, action) => {
      const m = action.payload;
      const isGroup = !!m.groupId;
      const type = isGroup ? 'GROUP' : 'PRIVATE';

      // Determine the other participant id for PRIVATE using currentUserId
      let id;
      if (isGroup) {
        id = m.groupId;
      } else if (state.currentUserId) {
        const me = state.currentUserId;
        const senderId = m.sender?.id;
        const receiverId = m.receiver?.id;
        id = senderId === me ? receiverId : senderId;
      } else {
        // Fallback if we don't know who we are yet
        id = m.receiver?.id || m.sender?.id;
      }
      if (!id) return;

      // If a wrong self-conversation exists (id === currentUserId), drop it
      if (!isGroup && state.currentUserId && id !== state.currentUserId) {
        const selfIdx = state.conversations.findIndex((c) => c.type === 'PRIVATE' && c.id === state.currentUserId);
        if (selfIdx !== -1) state.conversations.splice(selfIdx, 1);
      }

      const index = state.conversations.findIndex((c) => c.id === id && c.type === type);

      const otherUser = !isGroup
        ? (m.sender?.id === state.currentUserId ? m.receiver : m.sender)
        : null;

      if (index !== -1) {
        const conv = state.conversations[index];
        conv.lastMessage = m.content;
        conv.lastMessageTimestamp = m.timestamp;
        if (!isGroup) {
          // keep name and avatar up to date
          if (otherUser?.username) conv.name = otherUser.username;
          if (otherUser?.profilePictureUrl) conv.profilePictureUrl = otherUser.profilePictureUrl;
        }
        if (state.currentUserId && m.sender?.id !== state.currentUserId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      } else {
        const conversation = {
          id,
          name: isGroup ? (m.groupName || 'Group') : (otherUser?.username || 'User'),
          type,
          lastMessage: m.content,
          lastMessageTimestamp: m.timestamp,
          unreadCount: state.currentUserId && m.sender?.id !== state.currentUserId ? 1 : 0,
          profilePictureUrl: isGroup ? null : (otherUser?.profilePictureUrl || null),
        };
        state.conversations.push(conversation);
      }

      state.conversations.sort((a, b) => new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0));
    },
    markConversationAsRead: (state, action) => {
      const { conversationId, type } = action.payload;
      const index = state.conversations.findIndex(
        (c) => c.id === conversationId && c.type === type
      );
      if (index !== -1) {
        state.conversations[index].unreadCount = 0;
      }
    },
    updateConversationUnreadCount: (state, action) => {
      const { conversationId, type, count } = action.payload;
      const index = state.conversations.findIndex(
        (c) => c.id === conversationId && c.type === type
      );
      if (index !== -1) {
        state.conversations[index].unreadCount = count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const incoming = action.payload || [];
        // Build a map using existing first to preserve locally-created conversations (e.g., non-contacts)
        const byKey = new Map();
        const makeKey = (c) => `${c.type}:${c.id}`;
        // Seed with existing
        state.conversations.forEach((c) => {
          byKey.set(makeKey(c), { ...c });
        });
        // Merge incoming, preserving group avatars and updating lastMessage/unread
        incoming.forEach((c) => {
          const key = makeKey(c);
          const existing = byKey.get(key);
          const preservedImage = c.type === 'GROUP'
            ? (c.profilePictureUrl || existing?.profilePictureUrl || null)
            : c.profilePictureUrl;
          byKey.set(key, { ...existing, ...c, profilePictureUrl: preservedImage });
        });
        // Write back as array, sorted by lastMessageTimestamp desc
        state.conversations = Array.from(byKey.values()).sort(
          (a, b) => new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setCurrentUserId, setConversationImage, updateConversation, markConversationAsRead, updateConversationUnreadCount } = conversationsSlice.actions;

export default conversationsSlice.reducer;
