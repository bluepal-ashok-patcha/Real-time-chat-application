import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async (page = 0, size = 100) => {
  const response = await api.get(`/contacts?page=${page}&size=${size}`);
  return response.data.content || [];
});

export const addContact = createAsyncThunk('contacts/addContact', async (contactId) => {
  const response = await api.post(`/contacts/${contactId}`);
  return response.data;
});

export const removeContact = createAsyncThunk('contacts/removeContact', async (contactId) => {
  await api.delete(`/contacts/${contactId}`);
  return contactId;
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
    clearSelectedContact: (state) => {
      state.selectedContact = null;
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
      })
      .addCase(addContact.fulfilled, (state, action) => {
        if (!state.contacts.find((c) => c.contact.id === action.payload.contact.id)) {
          state.contacts.push(action.payload);
        }
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter((c) => c.contact.id !== action.payload);
        if (state.selectedContact?.id === action.payload) {
          state.selectedContact = null;
        }
      });
  },
});

export const { selectContact, clearSelectedContact } = contactsSlice.actions;

export default contactsSlice.reducer;
