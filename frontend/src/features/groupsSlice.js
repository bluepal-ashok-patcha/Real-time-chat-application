import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const createGroup = createAsyncThunk('groups/createGroup', async (groupName) => {
  const response = await api.post('/groups', { name: groupName });
  return response.data;
});

export const addUserToGroup = createAsyncThunk('groups/addUserToGroup', async ({ groupId, userId }) => {
  const response = await api.post(`/groups/${groupId}/users/${userId}`);
  return response.data;
});

export const removeUserFromGroup = createAsyncThunk('groups/removeUserFromGroup', async ({ groupId, userId }) => {
  const response = await api.delete(`/groups/${groupId}/users/${userId}`);
  return response.data;
});

const initialState = {
  groups: [],
  status: 'idle',
  error: null,
};

export const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    addGroup: (state, action) => {
      if (!state.groups.find((g) => g.id === action.payload.id)) {
        state.groups.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGroup.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (!state.groups.find((g) => g.id === action.payload.id)) {
          state.groups.push(action.payload);
        }
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addUserToGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      .addCase(removeUserFromGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      });
  },
});

export const { addGroup } = groupsSlice.actions;

export default groupsSlice.reducer;

