import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  Button,
  Badge,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';

const ContactItem = memo(({ contact, selectedRecipient, setSelectedRecipient }) => (
  <ListItem
    key={contact.username}
    button
    onClick={() => setSelectedRecipient(contact.username)}
    sx={{
      bgcolor: selectedRecipient === contact.username ? '#f0f0f0' : 'inherit',
    }}
  >
    <ListItemAvatar>
      <Avatar>{contact.username[0].toUpperCase()}</Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={contact.username}
      secondary={
        contact.lastMessage ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '150px',
            }}
          >
            {contact.lastMessage.content}
          </Typography>
        ) : (
          'No messages yet'
        )
      }
    />
    {contact.unreadCount > 0 && (
      <Badge badgeContent={contact.unreadCount} color="success">
        <NotificationsIcon color="action" />
      </Badge>
    )}
  </ListItem>
));

const MessagingApp = () => {
  const username = localStorage.getItem('username');
  const [messages, setMessages] = useState([]);
  const [contactsData, setContactsData] = useState([]);
  const [content, setContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const clientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Redirect to login if no username
  useEffect(() => {
    if (!username) {
      navigate('/login');
    }
  }, [username, navigate]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch contacts data
  const fetchContactsData = useCallback(() => {
    if (!username) return;
    axios
      .get(`http://localhost:8080/api/messages/contacts/${username}`)
      .then((response) => {
        setContactsData(response.data.sort((a, b) => a.username.localeCompare(b.username)));
      })
      .catch((error) => console.error('Error fetching contacts:', error));
  }, [username]);

  // WebSocket setup
  useEffect(() => {
    if (!username) return;

    clientRef.current = new StompJs.Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connected to WebSocket');

        // Subscribe to messages
        clientRef.current.subscribe(`/topic/messages/${username}`, (message) => {
          try {
            const newMessage = JSON.parse(message.body);
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) {
                return prev.map((msg) => (msg.id === newMessage.id ? newMessage : msg));
              }
              return [...prev, newMessage];
            });
            if (
              newMessage.sender !== selectedRecipient &&
              newMessage.recipient === username &&
              Notification.permission === 'granted'
            ) {
              new Notification(`New message from ${newMessage.sender}`, {
                body: newMessage.content,
                icon: '/vite.svg',
              });
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });

        // Subscribe to contact updates
        clientRef.current.subscribe(`/topic/contacts/${username}`, (contactUpdate) => {
          try {
            const updatedContact = JSON.parse(contactUpdate.body);
            setContactsData((prev) => {
              const updated = prev.filter((c) => c.username !== updatedContact.username);
              return [...updated, updatedContact].sort((a, b) => a.username.localeCompare(b.username));
            });
          } catch (error) {
            console.error('Error parsing contact update:', error);
          }
        });
      },
      onStompError: (frame) => console.error('STOMP error:', frame),
      onWebSocketError: (error) => console.error('WebSocket error:', error),
    });

    clientRef.current.activate();

    // Initial fetch of contacts data
    fetchContactsData();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        console.log('WebSocket disconnected');
      }
    };
  }, [username, fetchContactsData]);

  // Fetch conversation when selecting a recipient
  useEffect(() => {
    if (selectedRecipient && username) {
      axios
        .get(`http://localhost:8080/api/messages/conversation/${username}/${selectedRecipient}`)
        .then((response) => {
          setMessages(response.data);
        })
        .catch((error) => console.error('Error fetching conversation:', error));

      // Mark messages as read
      axios
        .post(`http://localhost:8080/api/messages/mark-read/${username}/${selectedRecipient}`)
        .then(() => {
          console.log('Messages marked as read for', selectedRecipient);
        })
        .catch((error) => console.error('Error marking messages as read:', error));
    }
  }, [selectedRecipient, username]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!content || !selectedRecipient) {
      console.error('Recipient and content are required');
      return;
    }
    axios
      .post(
        `http://localhost:8080/api/messages/send?sender=${username}&recipient=${selectedRecipient}&content=${content}`
      )
      .then(() => {
        setContent('');
        if (!contactsData.some((c) => c.username === selectedRecipient)) {
          setContactsData((prev) =>
            [...prev, { username: selectedRecipient, unreadCount: 0, lastMessage: null }].sort(
              (a, b) => a.username.localeCompare(b.username)
            )
          );
        }
      })
      .catch((error) => console.error('Error sending message:', error));
  }, [content, selectedRecipient, username, contactsData]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('username');
    navigate('/login');
  }, [navigate]);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'SENT':
        return <DoneIcon fontSize="small" sx={{ color: 'gray' }} />;
      case 'DELIVERED':
        return <DoneAllIcon fontSize="small" sx={{ color: 'gray' }} />;
      case 'READ':
        return <DoneAllIcon fontSize="small" sx={{ color: '#4FC3F7' }} />;
      default:
        return null;
    }
  }, []);

  // Filter contacts based on search query
  const filteredContacts = contactsData.filter((contact) =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!username) return null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#ECE5DD' }}>
      {/* Sidebar: Contact List */}
      <Drawer
        variant="permanent"
        sx={{
          width: 300,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box', bgcolor: '#fff' },
        }}
      >
        <AppBar position="static" sx={{ bgcolor: '#075E54' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#fff' }}>
              Chats ({username})
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            variant="outlined"
            size="small"
          />
        </Box>
        <List>
          {filteredContacts.map((contact) => (
            <ContactItem
              key={contact.username}
              contact={contact}
              selectedRecipient={selectedRecipient}
              setSelectedRecipient={setSelectedRecipient}
            />
          ))}
        </List>
      </Drawer>

      {/* Chat Window */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRecipient ? (
          <>
            {/* Chat Header */}
            <AppBar position="static" sx={{ bgcolor: '#075E54' }}>
              <Toolbar>
                <Avatar sx={{ mr: 2 }}>{selectedRecipient[0].toUpperCase()}</Avatar>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {selectedRecipient}
                </Typography>
              </Toolbar>
            </AppBar>

            {/* Messages */}
            <Box
              sx={{
                flexGrow: 1,
                p: 2,
                overflowY: 'auto',
                bgcolor: '#ECE5DD',
              }}
            >
              {messages
                .filter(
                  (msg) =>
                    (msg.sender === username && msg.recipient === selectedRecipient) ||
                    (msg.sender === selectedRecipient && msg.recipient === username)
                )
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.sender === username ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        maxWidth: '60%',
                        p: 1,
                        bgcolor: msg.sender === username ? '#DCF8C6' : '#fff',
                        borderRadius: 2,
                        boxShadow: 1,
                        display: 'flex',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                      <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                        {msg.sender === username && getStatusIcon(msg.status)}
                      </Box>
                    </Paper>
                  </Box>
                ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, bgcolor: '#fff', display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Type a message"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                color="success"
                endIcon={<SendIcon />}
                onClick={sendMessage}
              >
                Send
              </Button>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#ECE5DD',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a contact to start chatting
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagingApp;