import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import contactsReducer from './features/contactsSlice';
import messagesReducer from './features/messagesSlice';
import conversationsReducer from './features/conversationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contacts: contactsReducer,
    messages: messagesReducer,
    conversations: conversationsReducer,
  },
});
