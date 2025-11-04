import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import contactsReducer from './features/contactsSlice';
import messagesReducer from './features/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contacts: contactsReducer,
    messages: messagesReducer,
  },
});
