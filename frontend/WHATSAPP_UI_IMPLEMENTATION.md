# WhatsApp Web UI Implementation

## Overview

A complete WhatsApp Web-like UI built with React, Material-UI, Tailwind CSS, and Redux Toolkit, integrated with the backend real-time chat application.

## Features Implemented

### ✅ Complete WhatsApp Web UI
- **Sidebar** with conversations list
- **Chat Window** with message bubbles
- **Chat Header** with online status and options
- **Message Input** with typing indicators
- **Real-time messaging** via WebSocket
- **Online/Offline status** tracking
- **Read receipts** (single and double checkmarks)
- **Typing indicators**
- **Group chat** support
- **Private chat** support

### ✅ Authentication
- Login page with WhatsApp styling
- Register page with WhatsApp styling
- JWT token management
- Auto-login after registration

### ✅ Contact Management
- Add contacts
- Remove contacts
- View contacts list
- Block/unblock users

### ✅ Group Management
- Create groups
- Add users to groups
- Remove users from groups
- Group chat messaging

### ✅ Profile Management
- View profile
- Update profile picture URL
- Update about section

### ✅ Real-time Features
- WebSocket connection for instant messaging
- Online users tracking
- Last seen timestamps
- Typing indicators
- Read receipts
- Message status (SENT, DELIVERED, READ)

## Architecture

### Technology Stack
- **React 19** - UI framework
- **Material-UI (MUI)** - Component library
- **Tailwind CSS** - Utility-first CSS
- **Redux Toolkit** - State management
- **STOMP.js & SockJS** - WebSocket client
- **Axios** - HTTP client
- **React Router** - Navigation

### Project Structure

```
frontend/src/
├── components/
│   ├── Sidebar.jsx           # Conversations list
│   ├── ChatHeader.jsx        # Chat header with options
│   ├── ChatWindow.jsx        # Messages display area
│   ├── MessageBubble.jsx     # Individual message bubble
│   ├── MessageInput.jsx      # Message input with typing
│   ├── AddContactModal.jsx   # Add contact dialog
│   ├── CreateGroupModal.jsx  # Create group dialog
│   └── ProfileMenu.jsx       # Profile menu
├── pages/
│   ├── LoginPage.jsx         # Login page
│   ├── RegisterPage.jsx      # Register page
│   └── MessagingApp.jsx       # Main chat app
├── features/
│   ├── authSlice.js          # Authentication state
│   ├── contactsSlice.js      # Contacts state
│   ├── blocksSlice.js        # Blocked users state
│   ├── statusSlice.js        # Online status state
│   ├── groupsSlice.js        # Groups state
│   ├── messagesSlice.js      # Messages state
│   └── conversationsSlice.js  # Conversations list state
├── services/
│   ├── api.js                # Axios instance
│   └── websocket.js          # WebSocket service
└── store.js                  # Redux store
```

## Component Details

### Sidebar Component
- Displays conversations list (private and group)
- Shows unread message count
- Displays last message preview
- Shows timestamp (relative time)
- Search functionality
- Create group button
- Add contact button
- Profile menu

### ChatHeader Component
- Displays contact/group name
- Shows online status or last seen
- Phone and video call buttons (for private chats)
- Search button
- More options menu (block, delete chat, view profile)

### ChatWindow Component
- Displays messages in chat bubbles
- Scrolls to bottom on new messages
- Shows typing indicators
- WhatsApp-style background pattern
- Message alignment (sent on right, received on left)

### MessageBubble Component
- Different styles for sent/received messages
- Shows sender name in group chats
- Displays message timestamp
- Shows read receipts (✓ single, ✓✓ double)
- Color-coded status (gray for sent, blue for read)

### MessageInput Component
- Multi-line text input
- Send button
- Emoji button (placeholder)
- Attach file button (placeholder)
- Typing indicator trigger
- Enter to send, Shift+Enter for new line

## State Management (Redux)

### Auth Slice
- User profile
- JWT token
- Authentication status
- Login/Register/Profile update actions

### Contacts Slice
- Contacts list
- Selected contact
- Add/Remove contact actions

### Blocks Slice
- Blocked users list
- Block/Unblock actions

### Status Slice
- Online users list
- User status (online/offline/timestamp)
- Fetch status actions

### Groups Slice
- Groups list
- Create/Add/Remove user actions

### Messages Slice
- Messages by chat (private/group)
- Current chat
- Typing indicators
- Add message/Update status actions

### Conversations Slice
- Conversations list
- Update conversation on new message
- Mark as read
- Unread count management

## WebSocket Integration

### Connection
- Connects to `/ws` endpoint via SockJS
- Authenticates with JWT token
- Reconnects automatically on disconnect

### Subscriptions
1. **Private Messages**: `/user/{username}/queue/reply`
2. **Read Receipts**: `/user/{username}/queue/read`
3. **Typing Notifications**: `/user/{username}/queue/typing`
4. **Group Messages**: `/topic/{groupId}`
5. **Online Users**: `/topic/public`

### Real-time Features
- **Message Delivery**: Messages arrive instantly via WebSocket
- **Read Receipts**: Single check (sent), double check (read)
- **Typing Indicators**: Shows when someone is typing
- **Online Status**: Updates when users connect/disconnect

## API Integration

All backend APIs are integrated:

### Authentication APIs
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Contact APIs
- `GET /api/contacts` - Get contacts list
- `POST /api/contacts/{contactId}` - Add contact
- `DELETE /api/contacts/{contactId}` - Remove contact

### Block APIs
- `GET /api/blocks` - Get blocked users
- `POST /api/blocks/{blockedUserId}` - Block user
- `DELETE /api/blocks/{blockedUserId}` - Unblock user

### Status APIs
- `POST /api/users/status` - Get status for multiple users
- `GET /api/chat/users/online` - Get online users

### Chat APIs
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/{userId1}/{userId2}` - Get chat history (private)
- `GET /api/chat/messages/{groupId}` - Get chat history (group)
- `POST /api/chat/messages/{messageId}/read` - Mark message as read
- `GET /api/chat/messages/{messageId}/info` - Get message info
- `GET /api/chat/conversations` - Get conversations list

### Group APIs
- `POST /api/groups` - Create group
- `POST /api/groups/{groupId}/users/{userId}` - Add user to group
- `DELETE /api/groups/{groupId}/users/{userId}` - Remove user from group

## Styling

### WhatsApp Color Scheme
- **Primary Green**: `#25d366` (WhatsApp green)
- **Dark Green**: `#075e54` (Header background)
- **Light Green**: `#dcf8c6` (Sent message bubble)
- **Chat Background**: `#efeae2` (Chat background)
- **Sidebar**: `#ffffff` (White)
- **Text**: `#4a4a4a` (Dark gray)

### Tailwind CSS
- Custom colors configured in `tailwind.config.js`
- Utility classes for layout and styling
- Responsive design support

### Material-UI
- Pre-built components (Dialog, Menu, Avatar, etc.)
- Custom styling with sx prop
- Theme integration

## Real-time Message Flow

### Sending a Message
1. User types message and clicks send
2. `sendMessage` action dispatched
3. API call to `POST /api/chat/messages`
4. Message saved to database
5. Message sent to Kafka topic "messages"
6. Kafka consumer receives message
7. Consumer sends via WebSocket to recipient(s)
8. Recipient receives message in real-time
9. Message added to Redux store
10. UI updates automatically

### Receiving a Message
1. WebSocket receives message
2. `addMessage` action dispatched
3. Message added to Redux store
4. UI updates automatically
5. Conversation list updated
6. Unread count incremented

### Typing Indicator
1. User types in input field
2. Typing notification sent via WebSocket
3. After 3 seconds of no typing, stop notification sent
4. Recipient receives typing indicator
5. UI shows "User is typing..."

### Read Receipts
1. User views message
2. `markMessageAsRead` action dispatched
3. API call to `POST /api/chat/messages/{messageId}/read`
4. Status updated in database
5. Read receipt sent to Kafka
6. Kafka consumer sends to sender via WebSocket
7. Sender receives read receipt
8. Message status updated to READ
9. Double checkmark displayed

## Running the Application

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend services running (API Gateway, Auth Service, Chat Service)

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Configuration
- API Base URL: `http://localhost:8080/api` (configured in `services/api.js`)
- WebSocket URL: `http://localhost:8080/ws` (configured in `services/websocket.js`)

## Future Enhancements

- [ ] File attachments (images, documents)
- [ ] Emoji picker
- [ ] Voice messages
- [ ] Video/voice calls
- [ ] Message search
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Dark mode
- [ ] Mobile responsive design
- [ ] Push notifications
- [ ] Message encryption
- [ ] Message deletion
- [ ] Message editing

## Notes

- WebSocket connection goes through API Gateway (port 8080)
- All API calls authenticated with JWT token
- Redux state persists during session
- Messages cached by chat key (private/group)
- Conversations refresh every 10 seconds
- Typing indicator timeout: 3 seconds
- Message timestamps formatted relative to now

## Troubleshooting

### WebSocket Connection Issues
- Check if backend services are running
- Verify WebSocket endpoint URL
- Check JWT token validity
- Check browser console for errors

### Messages Not Appearing
- Check Redux DevTools for state updates
- Verify WebSocket subscriptions
- Check API responses in Network tab
- Verify message is saved to database

### Typing Indicators Not Working
- Check WebSocket connection
- Verify typing notification payload
- Check recipient's subscription

---

**Built with ❤️ using React, Material-UI, and Tailwind CSS**

