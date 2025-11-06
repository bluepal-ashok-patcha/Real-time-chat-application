import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async ({ page = 0, size = 100, q = '', type = '' } = {}) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('size', size);
  if (q) params.append('q', q);
  if (type) params.append('type', type);
  const response = await api.get(`/contacts?${params.toString()}`);
  return response.data.content || [];
});

export const fetchInviteContacts = createAsyncThunk('contacts/fetchInviteContacts', async ({ page = 0, size = 100, q = '' } = {}) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('size', size);
  params.append('type', 'INVITE');
  if (q) params.append('q', q);
  const response = await api.get(`/contacts?${params.toString()}`);
  return response.data.content || [];
});

export const addContact = createAsyncThunk('contacts/addContact', async (contactId) => {
  const response = await api.post(`/contacts/${contactId}`);
  return response.data;
});

export const addContactByIdentifier = createAsyncThunk('contacts/addContactByIdentifier', async ({ username, email, phoneNumber, mobile }) => {
  // Support both phoneNumber and mobile for backward compatibility
  const phone = phoneNumber || mobile;
  const body = { username: username || null, email: email || null, phoneNumber: phone || null, mobile: phone || null };
  const response = await api.post(`/contacts/add-by-identifier`, body);
  return response.data; // {found, added, identifier, user?, contact?}
});

export const sendInviteEmail = createAsyncThunk('contacts/sendInviteEmail', async (email) => {
  await api.post(`/contacts/invite?email=${encodeURIComponent(email)}`);
  return email;
});

export const removeContact = createAsyncThunk('contacts/removeContact', async (contactId) => {
  await api.delete(`/contacts/${contactId}`);
  return contactId;
});

const initialState = {
  contacts: [], // registered users
  inviteContacts: [], // placeholder/invite contacts
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
        // If type filter was applied, caller may have set it; here we assume default USER list
        state.contacts = action.payload.filter((c) => !c.invite);
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchInviteContacts.fulfilled, (state, action) => {
        state.inviteContacts = action.payload.filter((c) => c.invite);
      })
      .addCase(addContact.fulfilled, (state, action) => {
        if (!state.contacts.find((c) => c.contact.id === action.payload.contact.id)) {
          state.contacts.push(action.payload);
        }
      })
      .addCase(addContactByIdentifier.fulfilled, (state, action) => {
        const result = action.payload;
        if (result.found && result.contact) {
          if (!state.contacts.find((c) => c.id === result.contact.id)) {
            state.contacts.push(result.contact);
          }
        } else if (!result.found && result.contact) {
          if (!state.inviteContacts.find((c) => c.id === result.contact.id)) {
            state.inviteContacts.push(result.contact);
          }
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
