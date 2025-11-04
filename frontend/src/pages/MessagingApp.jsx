import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import { fetchContacts, selectContact } from '../features/contactsSlice';
import { fetchMessages, sendMessage, addMessage } from '../features/messagesSlice';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const MessagingApp = () => {
  const dispatch = useDispatch();
  const { contacts, selectedContact } = useSelector((state) => state.contacts);
  const { messages } = useSelector((state) => state.messages);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchContacts());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (selectedContact) {
      dispatch(fetchMessages({ userId: user.id, contactId: selectedContact.id }));
    }
  }, [dispatch, selectedContact, user.id]);

  useEffect(() => {
    const client = new StompJs.Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/user/${user.id}/queue/reply`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          dispatch(addMessage(receivedMessage));
        });
      },
    });

    if (token) {
      client.activate();
    }

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [dispatch, token, user.id]);

  const handleSelectContact = (contact) => {
    dispatch(selectContact(contact));
  };

  const handleSendMessage = (content) => {
    dispatch(sendMessage({ receiverId: selectedContact.id, content }));
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar contacts={contacts} onSelectContact={handleSelectContact} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatWindow messages={messages} selectedContact={selectedContact} />
        {selectedContact && <MessageInput onSendMessage={handleSendMessage} />}
      </Box>
    </Box>
  );
};

export default MessagingApp;
