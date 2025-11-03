import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async () => {
  const response = await api.get('/contacts');
  return response.data.content;
});

const initialState = {
  contacts: [],
  selectedContact: null,
  status: 'idle',
  error: null,
};

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    selectContact: (state, action) => {
      state.selectedContact = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { selectContact } = contactsSlice.actions;

export default contactsSlice.reducer;
