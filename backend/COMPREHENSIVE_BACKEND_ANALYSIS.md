# Comprehensive Backend Analysis - Real-Time Chat Application

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Models & Entities](#models--entities)
3. [DTOs](#dtos)
4. [Security & Configuration](#security--configuration)
5. [Services & Implementations](#services--implementations)
6. [Controllers & APIs](#controllers--apis)
7. [Repositories](#repositories)
8. [JWT Utilities](#jwt-utilities)
9. [Kafka Integration](#kafka-integration)
10. [Redis Integration](#redis-integration)
11. [WebSocket Integration](#websocket-integration)
12. [API Flows](#api-flows)
13. [Complete System Flow](#complete-system-flow)

---

## Architecture Overview

The application follows a **microservices architecture** with the following services:

1. **Eureka Server** (Port 8761) - Service discovery server
2. **API Gateway** (Port 8080) - Single entry point for all client requests
3. **Auth Service** (Port 8081) - Handles authentication, user management, contacts, blocks, and status
4. **Chat Service** (Port 8084) - Handles messaging, groups, real-time communication

### Technology Stack
- **Spring Boot** - Framework
- **Spring Cloud Gateway** - API Gateway
- **Spring Cloud Netflix Eureka** - Service Discovery
- **Spring Security** - Security
- **JWT** - Authentication
- **MySQL** - Database
- **Redis** - Caching & Online status
- **Kafka** - Message queue for async messaging
- **WebSocket (STOMP)** - Real-time bidirectional communication

---

## Models & Entities

### Auth Service Models

#### 1. User Entity
```java
@Entity
@Table(name = "users")
```
**Fields:**
- `id` (Long) - Primary key
- `username` (String) - Unique username
- `email` (String) - Unique email
- `password` (String) - BCrypt encrypted password
- `role` (Role enum) - USER or ADMIN
- `profilePictureUrl` (String) - Optional profile picture URL
- `about` (String) - Optional user bio

#### 2. Contact Entity
```java
@Entity
@Table(name = "contacts")
```
**Fields:**
- `id` (Long) - Primary key
- `user` (User) - ManyToOne relationship with User
- `contact` (User) - ManyToOne relationship with User (the contact)

**Purpose:** Represents a user's contact list (friends/contacts)

#### 3. Block Entity
```java
@Entity
@Table(name = "blocks")
```
**Fields:**
- `id` (Long) - Primary key
- `user` (User) - ManyToOne relationship (user who blocked)
- `blockedUser` (User) - ManyToOne relationship (user who is blocked)

**Purpose:** Represents blocked users (prevents messaging)

#### 4. Role Enum
```java
public enum Role {
    USER,
    ADMIN
}
```

### Chat Service Models

#### 1. Message Entity
```java
@Entity
@Table(name = "messages")
```
**Fields:**
- `id` (Long) - Primary key
- `senderId` (Long) - ID of sender
- `receiverId` (Long) - ID of receiver (null for group messages)
- `groupId` (Long) - ID of group (null for private messages)
- `content` (String) - Message content
- `timestamp` (LocalDateTime) - When message was sent
- `status` (MessageStatus.Status) - DELIVERED or READ

**Note:** Supports both private (one-on-one) and group messages

#### 2. Group Entity
```java
@Entity
@Table(name = "groups")
```
**Fields:**
- `id` (Long) - Primary key
- `name` (String) - Group name
- `createdBy` (Long) - User ID who created the group

#### 3. GroupUser Entity (Composite Key)
```java
@Entity
@Table(name = "group_users")
@IdClass(GroupUser.GroupUserId.class)
```
**Fields:**
- `groupId` (Long) - Composite key part 1
- `userId` (Long) - Composite key part 2

**Purpose:** Many-to-many relationship between Groups and Users

#### 4. MessageStatus Entity (Composite Key)
```java
@Entity
@Table(name = "message_status")
@IdClass(MessageStatus.MessageStatusId.class)
```
**Fields:**
- `messageId` (Long) - Composite key part 1
- `userId` (Long) - Composite key part 2
- `status` (Status enum) - DELIVERED or READ

**Purpose:** Tracks read receipts for group messages (each member has their own status)

#### 5. MessageType Enum
```java
public enum MessageType {
    CHAT,    // Regular chat message
    JOIN,    // User joined
    LEAVE    // User left
}
```

#### 6. MessageStatus.Status Enum
```java
public enum Status {
    DELIVERED,  // Message delivered but not read
    READ        // Message read
}
```

---

## DTOs

### Auth Service DTOs

#### 1. RegisterRequest
**Purpose:** User registration
```java
- username (String) - @NotBlank
- email (String) - @NotBlank, @Email
- password (String) - @NotBlank
```

#### 2. AuthRequest
**Purpose:** User login
```java
- username (String) - @NotBlank
- password (String) - @NotBlank
```

#### 3. AuthResponse
**Purpose:** Login response
```java
- token (String) - JWT token
```

#### 4. UserDto
**Purpose:** User data transfer
```java
- id (Long)
- username (String)
- email (String)
- role (Role)
- profilePictureUrl (String)
- about (String)
```

#### 5. ContactDto
**Purpose:** Contact data transfer
```java
- id (Long)
- user (UserDto)
- contact (UserDto)
```

#### 6. BlockDto
**Purpose:** Block data transfer
```java
- id (Long)
- user (UserDto)
- blockedUser (UserDto)
```

#### 7. StatusDto
**Purpose:** User online/offline status
```java
- status (Map<Long, String>) - Maps user ID to status ("online" or timestamp)
```

#### 8. StatusRequest
**Purpose:** Request status for multiple users
```java
- userIds (List<Long>)
```

#### 9. ProfileUpdateRequest
**Purpose:** Update user profile
```java
- profilePictureUrl (String)
- about (String)
```

### Chat Service DTOs

#### 1. MessageDto
**Purpose:** Message data transfer
```java
- id (Long)
- sender (UserDto)
- receiver (UserDto)
- groupId (Long)
- content (String)
- timestamp (LocalDateTime)
- type (MessageType)
- status (MessageStatus.Status)
```

#### 2. ChatMessage
**Purpose:** WebSocket message format
```java
- type (MessageType)
- content (String)
- sender (String) - username
- receiver (String) - username
- groupId (Long)
```

#### 3. GroupDto
**Purpose:** Group data transfer
```java
- id (Long)
- name (String)
- createdBy (Long)
- users (Set<UserDto>)
```

#### 4. ConversationDto
**Purpose:** Conversation list item
```java
- id (Long) - User ID (private) or Group ID (group)
- name (String) - Username or group name
- type (String) - "PRIVATE" or "GROUP"
- lastMessage (String)
- lastMessageTimestamp (LocalDateTime)
- unreadCount (long)
- profilePictureUrl (String)
```

#### 5. ReadReceipt
**Purpose:** Read receipt notification
```java
- messageId (Long)
- sender (String) - username
- receiver (String) - username
```

#### 6. TypingNotification
**Purpose:** Typing indicator
```java
- sender (String)
- receiver (String)
- groupId (Long)
- typing (boolean)
```

#### 7. MessageInfoDto
**Purpose:** Message read status info
```java
- readBy (List<UserDto>)
- deliveredTo (List<UserDto>)
```

---

## Security & Configuration

### API Gateway Security

#### SecurityConfig
- **CORS:** Enabled for `http://localhost:5173`
- **CSRF:** Disabled
- **Methods:** GET, POST, PUT, DELETE, OPTIONS

#### GatewayConfig
- **Routes:**
  - `/api/auth/**`, `/api/contacts/**`, `/api/blocks/**`, `/api/users/**` → `lb://auth-service`
  - `/api/chat/**`, `/api/groups/**` → `lb://chat-service`
- **Filter:** JwtAuthenticationFilter applied to all routes

#### JwtAuthenticationFilter
- **Public Endpoints:** `/api/auth/register`, `/api/auth/login`
- **Other Endpoints:** Require JWT token in `Authorization: Bearer <token>` header
- **Validation:**
  - Checks for Authorization header
  - Validates JWT signature
  - Verifies role is "USER"
  - Returns 401 if invalid, 403 if role mismatch

### Auth Service Security

#### SecurityConfig
- **CORS:** Disabled
- **CSRF:** Disabled
- **Session:** STATELESS
- **Public Endpoints:** `/api/auth/**`
- **Protected Endpoints:** All others require authentication
- **Filter:** AuthTokenFilter (validates JWT and sets authentication)

#### AuthTokenFilter
- Extracts JWT from `Authorization: Bearer <token>` header
- Validates token using JwtUtil
- Loads user details and sets authentication in SecurityContext

#### AuthEntryPointJwt
- Handles unauthorized access (401 responses)

### Chat Service Security

#### SecurityConfig
- **CORS:** Enabled
- **CSRF:** Disabled
- **Authorization:** All endpoints permitted (security handled by API Gateway)

#### WebSocketAuthConfig
- Intercepts WebSocket CONNECT commands
- Validates JWT from `Authorization: Bearer <token>` header
- Sets authenticated user in WebSocket session

---

## Services & Implementations

### Auth Service

#### 1. AuthServiceImpl

**register(RegisterRequest)**
- Validates username and email uniqueness
- Throws `UsernameAlreadyExistsException` if duplicate
- Encodes password using BCrypt
- Creates user with role USER
- Returns saved User

**login(AuthRequest)**
- Authenticates using Spring Security AuthenticationManager
- Generates JWT token using JwtUtil
- Returns AuthResponse with token

**getUserById(Long)**
- Retrieves user by ID
- Throws RuntimeException if not found

**updateProfile(Long, ProfileUpdateRequest)**
- Updates profilePictureUrl and about
- Returns updated User

#### 2. ContactServiceImpl

**addContact(Long userId, Long contactId)**
- Validates both users exist
- Creates Contact relationship
- Returns ContactDto

**removeContact(Long userId, Long contactId)**
- Finds and deletes contact relationship
- Throws RuntimeException if not found

**getContacts(Long userId, Pageable)**
- Returns paginated list of user's contacts
- Returns Page<ContactDto>

#### 3. BlockServiceImpl

**blockUser(Long userId, Long blockedUserId)**
- Validates both users exist
- Creates Block relationship
- Returns BlockDto

**unblockUser(Long userId, Long blockedUserId)**
- Finds and deletes block relationship
- Throws RuntimeException if not found

**getBlockedUsers(Long userId, Pageable)**
- Returns paginated list of blocked users
- Returns Page<BlockDto>

#### 4. StatusServiceImpl

**getStatus(List<Long> userIds)**
- Checks Redis for online users set (`online-users`)
- For each user:
  - If username in online set → status = "online"
  - Else → checks `last-seen:<username>` key → status = timestamp or "offline"
- Returns StatusDto with Map<Long, String>

### Chat Service

#### 1. MessageServiceImpl

**sendMessage(Long senderId, MessageDto)**
- Sets sender from token
- **For Group Messages:**
  - Validates sender is group member
  - Creates Message with groupId
  - Creates MessageStatus entries for all group members (except sender)
- **For Private Messages:**
  - Validates receiver exists
  - Checks if sender is blocked by receiver
  - Creates Message with receiverId
- Saves message with status DELIVERED
- Sends message to Kafka topic "messages"
- Returns MessageDto

**getChatHistory(Long userId1, Long userId2, Pageable)**
- Retrieves paginated messages between two users
- Returns Page<MessageDto>

**getGroupChatHistory(Long groupId, Pageable)**
- Retrieves paginated messages for a group
- Returns Page<MessageDto>

**markMessageAsRead(Long userId, Long messageId)**
- **For Group Messages:**
  - Updates MessageStatus to READ for the user
- **For Private Messages:**
  - Updates Message status to READ (if user is receiver)
- Sends ReadReceipt to Kafka topic "read-receipts"
- Returns void

**getMessageInfo(Long messageId)**
- Retrieves all MessageStatus entries for the message
- Separates into readBy (status = READ) and deliveredTo (status = DELIVERED)
- Returns MessageInfoDto

**getConversations(Long userId)**
- **Private Conversations:**
  - Gets all contacts
  - For each contact, finds last message and unread count
  - Creates ConversationDto for each
- **Group Conversations:**
  - Gets all groups user is member of
  - For each group, finds last message and unread count
  - Creates ConversationDto for each
- Sorts by lastMessageTimestamp (most recent first)
- Returns List<ConversationDto>

#### 2. GroupServiceImpl

**createGroup(GroupDto)**
- Creates Group entity
- Adds creator as first member (GroupUser)
- Returns GroupDto with users

**addUserToGroup(Long groupId, Long userId)**
- Validates group and user exist
- Validates user is in creator's contacts
- Adds user to group (GroupUser)
- Returns GroupDto

**removeUserFromGroup(Long groupId, Long userId)**
- Removes GroupUser relationship
- Returns GroupDto

---

## Controllers & APIs

### Auth Service Controllers

#### AuthController (`/api/auth`)

**POST /register**
- **Request:** RegisterRequest (username, email, password)
- **Response:** UserDto (200 OK)
- **Validation:** @Valid on request body
- **Logic:** Calls AuthService.register()

**POST /login**
- **Request:** AuthRequest (username, password)
- **Response:** AuthResponse (token) (200 OK)
- **Validation:** @Valid on request body
- **Logic:** Calls AuthService.login()

**GET /profile**
- **Request:** Authorization header with JWT
- **Response:** UserDto (200 OK)
- **Security:** Requires JWT (validated by filter)
- **Logic:** Extracts userId from token, calls AuthService.getUserById()

**PUT /profile**
- **Request:** Authorization header + ProfileUpdateRequest
- **Response:** UserDto (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls AuthService.updateProfile()

**GET /hello**
- **Request:** Authorization header
- **Response:** String (200 OK)
- **Security:** Requires JWT
- **Logic:** Test endpoint

#### ContactController (`/api/contacts`)

**POST /{contactId}**
- **Request:** Authorization header + contactId in path
- **Response:** ContactDto (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls ContactService.addContact()

**DELETE /{contactId}**
- **Request:** Authorization header + contactId in path
- **Response:** 200 OK (void)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls ContactService.removeContact()

**GET**
- **Request:** Authorization header + Pageable (page, size, sort)
- **Response:** Page<ContactDto> (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls ContactService.getContacts()

#### BlockController (`/api/blocks`)

**POST /{blockedUserId}**
- **Request:** Authorization header + blockedUserId in path
- **Response:** BlockDto (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls BlockService.blockUser()

**DELETE /{blockedUserId}**
- **Request:** Authorization header + blockedUserId in path
- **Response:** 200 OK (void)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls BlockService.unblockUser()

**GET**
- **Request:** Authorization header + Pageable
- **Response:** Page<BlockDto> (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls BlockService.getBlockedUsers()

#### StatusController (`/api/users`)

**POST /status**
- **Request:** StatusRequest (userIds: List<Long>)
- **Response:** StatusDto (status: Map<Long, String>) (200 OK)
- **Security:** No JWT required (or handled by gateway)
- **Logic:** Calls StatusService.getStatus()

### Chat Service Controllers

#### ChatController (`/api/chat`)

**POST /messages**
- **Request:** Authorization header + MessageDto (receiver/groupId, content)
- **Response:** MessageDto (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts senderId from token, calls MessageService.sendMessage()
- **Flow:** 
  1. Validates and saves message
  2. Sends to Kafka topic "messages"
  3. Kafka consumer receives and sends via WebSocket

**GET /messages/{userId1}/{userId2}**
- **Request:** userId1, userId2 in path + Pageable
- **Response:** Page<MessageDto> (200 OK)
- **Logic:** Calls MessageService.getChatHistory()

**GET /messages/{groupId}**
- **Request:** groupId in path + Pageable
- **Response:** Page<MessageDto> (200 OK)
- **Logic:** Calls MessageService.getGroupChatHistory()

**POST /messages/{messageId}/read**
- **Request:** Authorization header + messageId in path
- **Response:** 200 OK (void)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls MessageService.markMessageAsRead()
- **Flow:**
  1. Updates status in database
  2. Sends ReadReceipt to Kafka topic "read-receipts"
  3. Kafka consumer sends to sender via WebSocket

**GET /messages/{messageId}/info**
- **Request:** messageId in path
- **Response:** MessageInfoDto (readBy, deliveredTo) (200 OK)
- **Logic:** Calls MessageService.getMessageInfo()

**GET /conversations**
- **Request:** Authorization header
- **Response:** List<ConversationDto> (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts userId from token, calls MessageService.getConversations()

**GET /users/online**
- **Request:** None
- **Response:** Set<String> (usernames) (200 OK)
- **Logic:** Returns online users from WebSocketEventListener

**WebSocket Endpoints:**

**@MessageMapping("/chat.sendMessage")**
- **Purpose:** Direct WebSocket message sending (bypasses Kafka)
- **Payload:** ChatMessage
- **Logic:** Sends to WebSocket topic/queue based on groupId or receiver

**@MessageMapping("/chat.typing")**
- **Purpose:** Typing indicator
- **Payload:** TypingNotification
- **Logic:** Sends typing notification to receiver or group

#### GroupController (`/api/groups`)

**POST**
- **Request:** Authorization header + GroupDto (name)
- **Response:** GroupDto (200 OK)
- **Security:** Requires JWT
- **Logic:** Extracts creatorId from token, calls GroupService.createGroup()

**POST /{groupId}/users/{userId}**
- **Request:** groupId, userId in path
- **Response:** GroupDto (200 OK)
- **Logic:** Calls GroupService.addUserToGroup()

**DELETE /{groupId}/users/{userId}**
- **Request:** groupId, userId in path
- **Response:** GroupDto (200 OK)
- **Logic:** Calls GroupService.removeUserFromGroup()

---

## Repositories

### Auth Service Repositories

#### UserRepository
- `findByUsername(String)` - Optional<User>
- `findByEmail(String)` - Optional<User>

#### ContactRepository
- `findByUserId(Long, Pageable)` - Page<Contact>
- `findByUserIdAndContactId(Long, Long)` - Optional<Contact>

#### BlockRepository
- `findByUserId(Long, Pageable)` - Page<Block>
- `findByUserIdAndBlockedUserId(Long, Long)` - Optional<Block>

### Chat Service Repositories

#### MessageRepository
- `findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampAsc(Long, Long, Long, Long, Pageable)` - Page<Message>
- `findByGroupIdOrderByTimestampAsc(Long, Pageable)` - Page<Message>
- `findLastPrivateMessage(Long, Long, Pageable)` - List<Message>
- `findLastGroupMessage(Long, Pageable)` - List<Message>
- `countUnreadPrivateMessages(Long, Long, Status)` - long

#### GroupRepository
- Standard JPA repository

#### GroupUserRepository
- `findByGroupId(Long)` - List<GroupUser>

#### MessageStatusRepository
- `findByMessageId(Long)` - List<MessageStatus>
- `countByGroupIdAndUserIdAndStatus(Long, Long, Status)` - long

---

## JWT Utilities

### Auth Service JwtUtil

**generateToken(User)**
- Creates claims: id, role
- Sets subject: username
- Expiration: 10 hours
- Algorithm: HS256
- Returns JWT string

**validateJwtToken(String)**
- Validates signature and expiration
- Returns boolean

**getUserNameFromJwtToken(String)**
- Extracts subject (username)
- Returns String

**getUserIdFromToken(String)**
- Extracts "id" claim
- Returns Long

### Chat Service JwtUtil

**getAllClaimsFromToken(String)**
- Parses and returns all claims
- Returns Claims

**getUsernameFromToken(String)**
- Extracts subject (username)
- Returns String

**validateToken(String)**
- Validates signature and expiration
- Returns boolean

**getUserIdFromToken(String)**
- Extracts "id" claim
- Returns Long

---

## Kafka Integration

### Kafka Topics

1. **"messages"** - For chat messages
2. **"read-receipts"** - For read receipts

### KafkaTopicConfig
- Creates topics if they don't exist

### KafkaProducer

**sendMessage(MessageDto)**
- Sends MessageDto to "messages" topic
- Used after saving message to database

**sendReadReceipt(ReadReceipt)**
- Sends ReadReceipt to "read-receipts" topic
- Used after marking message as read

### MessageListener

**@KafkaListener("messages")**
- Listens to "messages" topic
- **For Group Messages:** Sends to `/topic/{groupId}` via WebSocket
- **For Private Messages:** Sends to `/user/{receiver}/queue/reply` via WebSocket

**@KafkaListener("read-receipts")**
- Listens to "read-receipts" topic
- Sends to `/user/{sender}/queue/read` via WebSocket

**Flow:**
1. Message saved → KafkaProducer sends to "messages" topic
2. MessageListener consumes from Kafka
3. MessageListener sends via WebSocket to recipient(s)

---

## Redis Integration

### Purpose
- Store online users set
- Store last seen timestamps

### Redis Keys

1. **"online-users"** (Set<String>) - Contains usernames of online users
2. **"last-seen:<username>"** (String) - Timestamp of when user went offline

### RedisConfig (Both Services)
- Configures RedisTemplate with String serializers
- Connection: localhost:6379

### Usage in WebSocketEventListener
- **On Connect:** Adds username to "online-users" set, deletes "last-seen:<username>"
- **On Disconnect:** Removes from "online-users", sets "last-seen:<username>" to current timestamp

### Usage in StatusServiceImpl
- Checks "online-users" set to determine online status
- Reads "last-seen:<username>" to get last seen timestamp

---

## WebSocket Integration

### WebSocketConfig

**Endpoint:** `/ws` (with SockJS support)

**Message Broker:**
- Application destination prefix: `/app`
- Simple broker: `/topic`, `/queue`
- User destination prefix: `/user`

**Destinations:**
- `/topic/{groupId}` - Group messages
- `/topic/public` - Online users updates
- `/user/{username}/queue/reply` - Private messages
- `/user/{username}/queue/read` - Read receipts
- `/user/{username}/queue/typing` - Typing notifications

### WebSocketEventListener

**handleWebSocketConnectListener(SessionConnectedEvent)**
- Triggered when user connects
- Extracts username from JWT (set by WebSocketAuthConfig)
- Adds to Redis "online-users" set
- Deletes "last-seen:<username>" key
- Broadcasts online users list to `/topic/public`

**handleWebSocketDisconnectListener(SessionDisconnectEvent)**
- Triggered when user disconnects
- Removes from Redis "online-users" set
- Sets "last-seen:<username>" to current timestamp
- Broadcasts updated online users list to `/topic/public`

**getOnlineUsers()**
- Returns Set<String> of online usernames from Redis

### WebSocketAuthConfig

**configureClientInboundChannel()**
- Intercepts WebSocket CONNECT commands
- Validates JWT from Authorization header
- Sets authenticated user in session
- Allows WebSocket connection only if JWT is valid

### Message Flow

**Sending via WebSocket:**
1. Client sends to `/app/chat.sendMessage` with ChatMessage payload
2. ChatController handles and sends to appropriate destination
3. Recipient receives via WebSocket

**Sending via REST + Kafka:**
1. Client sends POST to `/api/chat/messages`
2. Message saved to database
3. KafkaProducer sends to "messages" topic
4. MessageListener consumes and sends via WebSocket

---

## API Flows

### 1. User Registration Flow

```
Client → API Gateway → Auth Service
Request: POST /api/auth/register
Body: { username, email, password }
Response: UserDto
```

**Steps:**
1. Client sends registration request to API Gateway
2. Gateway allows (no JWT required for /register)
3. Gateway routes to Auth Service
4. AuthService validates username/email uniqueness
5. Password encrypted with BCrypt
6. User saved to database
7. UserDto returned to client

### 2. User Login Flow

```
Client → API Gateway → Auth Service
Request: POST /api/auth/login
Body: { username, password }
Response: { token }
```

**Steps:**
1. Client sends login request
2. Gateway allows (no JWT required for /login)
3. Gateway routes to Auth Service
4. AuthService authenticates via AuthenticationManager
5. JWT token generated (10 hour expiration)
6. Token returned to client
7. Client stores token for subsequent requests

### 3. Send Private Message Flow

```
Client → API Gateway → Chat Service → Database → Kafka → WebSocket
Request: POST /api/chat/messages
Headers: Authorization: Bearer <token>
Body: { receiver: { id }, content }
Response: MessageDto
```

**Steps:**
1. Client sends message with JWT token
2. Gateway validates JWT (JwtAuthenticationFilter)
3. Gateway routes to Chat Service
4. ChatService extracts senderId from JWT
5. Validates receiver exists and sender not blocked
6. Saves Message to database (status: DELIVERED)
7. KafkaProducer sends MessageDto to "messages" topic
8. MessageListener consumes from Kafka
9. MessageListener sends via WebSocket to `/user/{receiver}/queue/reply`
10. Receiver receives message in real-time
11. MessageDto returned to sender

### 4. Send Group Message Flow

```
Client → API Gateway → Chat Service → Database → Kafka → WebSocket
Request: POST /api/chat/messages
Headers: Authorization: Bearer <token>
Body: { groupId, content }
Response: MessageDto
```

**Steps:**
1. Client sends message with JWT token
2. Gateway validates JWT
3. Gateway routes to Chat Service
4. ChatService validates sender is group member
5. Saves Message to database (status: DELIVERED)
6. Creates MessageStatus entries for all group members (except sender) with status DELIVERED
7. KafkaProducer sends MessageDto to "messages" topic
8. MessageListener consumes from Kafka
9. MessageListener sends via WebSocket to `/topic/{groupId}`
10. All group members receive message in real-time
11. MessageDto returned to sender

### 5. Mark Message as Read Flow

```
Client → API Gateway → Chat Service → Database → Kafka → WebSocket
Request: POST /api/chat/messages/{messageId}/read
Headers: Authorization: Bearer <token>
Response: 200 OK
```

**Steps:**
1. Client sends read receipt with JWT
2. Gateway validates JWT
3. Gateway routes to Chat Service
4. ChatService extracts userId from JWT
5. **For Group Messages:**
   - Updates MessageStatus to READ for the user
6. **For Private Messages:**
   - Updates Message status to READ
7. KafkaProducer sends ReadReceipt to "read-receipts" topic
8. MessageListener consumes from Kafka
9. MessageListener sends via WebSocket to `/user/{sender}/queue/read`
10. Sender receives read receipt in real-time

### 6. Get Online Status Flow

```
Client → API Gateway → Auth Service → Redis
Request: POST /api/users/status
Body: { userIds: [1, 2, 3] }
Response: { status: { 1: "online", 2: "1634567890", 3: "offline" } }
```

**Steps:**
1. Client sends user IDs list
2. Gateway routes to Auth Service
3. StatusService checks Redis:
   - If username in "online-users" set → "online"
   - Else checks "last-seen:<username>" → timestamp or "offline"
4. Returns StatusDto with Map<Long, String>

### 7. WebSocket Connection Flow

```
Client → WebSocket Endpoint (/ws) → WebSocketAuthConfig → WebSocketEventListener
```

**Steps:**
1. Client connects to `/ws` with JWT in Authorization header
2. WebSocketAuthConfig intercepts CONNECT command
3. Validates JWT and sets authenticated user
4. WebSocketEventListener.handleWebSocketConnectListener() triggered
5. Username added to Redis "online-users" set
6. "last-seen:<username>" deleted
7. Online users list broadcasted to `/topic/public`
8. All connected clients receive updated online users list

### 8. Get Conversations Flow

```
Client → API Gateway → Chat Service → Database
Request: GET /api/chat/conversations
Headers: Authorization: Bearer <token>
Response: List<ConversationDto>
```

**Steps:**
1. Client sends request with JWT
2. Gateway validates JWT
3. Gateway routes to Chat Service
4. ChatService extracts userId from JWT
5. Gets all contacts for user
6. For each contact:
   - Finds last message
   - Counts unread messages (status = DELIVERED)
   - Creates ConversationDto
7. Gets all groups user is member of
8. For each group:
   - Finds last message
   - Counts unread messages (MessageStatus where status = DELIVERED)
   - Creates ConversationDto
9. Sorts by lastMessageTimestamp (most recent first)
10. Returns List<ConversationDto>

### 9. Add Contact Flow

```
Client → API Gateway → Auth Service → Database
Request: POST /api/contacts/{contactId}
Headers: Authorization: Bearer <token>
Response: ContactDto
```

**Steps:**
1. Client sends request with JWT
2. Gateway validates JWT
3. Gateway routes to Auth Service
4. ContactController extracts userId from JWT
5. ContactService validates both users exist
6. Creates Contact relationship
7. Returns ContactDto

### 10. Block User Flow

```
Client → API Gateway → Auth Service → Database
Request: POST /api/blocks/{blockedUserId}
Headers: Authorization: Bearer <token>
Response: BlockDto
```

**Steps:**
1. Client sends request with JWT
2. Gateway validates JWT
3. Gateway routes to Auth Service
4. BlockController extracts userId from JWT
5. BlockService validates both users exist
6. Creates Block relationship
7. Returns BlockDto
8. **Note:** Blocked users cannot send messages to the blocker (checked in MessageService.sendMessage())

---

## Complete System Flow

### Overall Architecture Flow

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTP/WebSocket
       │
┌──────▼──────────────────┐
│    API Gateway          │
│  (Port 8080)            │
│  - JWT Validation       │
│  - Route to Services    │
└──────┬──────────────────┘
       │
       ├──────────────────┐
       │                  │
┌──────▼──────────┐  ┌────▼───────────┐
│  Auth Service   │  │  Chat Service  │
│  (Port 8081)    │  │  (Port 8084)   │
│                 │  │                │
│  - Users        │  │  - Messages    │
│  - Contacts     │  │  - Groups      │
│  - Blocks       │  │  - WebSocket   │
│  - Status       │  │  - Kafka       │
└──────┬──────────┘  └────┬───────────┘
       │                  │
       │                  │
┌──────▼──────────┐  ┌────▼───────────┐
│     MySQL       │  │     MySQL      │
│   (chatapp)     │  │   (chatapp)    │
└─────────────────┘  └────────────────┘
       │                  │
       │                  │
┌──────▼──────────────────▼───────────┐
│         Redis (Port 6379)           │
│  - online-users set                 │
│  - last-seen:<username> keys        │
└─────────────────────────────────────┘
       │
       │
┌──────▼──────────────────────────────┐
│      Kafka (Port 9092)               │
│  - messages topic                   │
│  - read-receipts topic              │
└──────────────────────────────────────┘
       │
       │
┌──────▼──────────────────────────────┐
│   Eureka Server (Port 8761)         │
│   - Service Discovery               │
└──────────────────────────────────────┘
```

### Request Flow Example: Send Message

```
1. Client → API Gateway (POST /api/chat/messages)
   - JWT validated by JwtAuthenticationFilter
   
2. API Gateway → Chat Service (load balanced via Eureka)
   - Routes to chat-service instance
   
3. Chat Service:
   - Extracts senderId from JWT
   - Validates message (blocked? group member?)
   - Saves Message to MySQL
   - Creates MessageStatus entries (for groups)
   - Sends MessageDto to Kafka "messages" topic
   
4. Kafka → MessageListener (in Chat Service)
   - Consumes MessageDto from "messages" topic
   - Sends via WebSocket to recipient(s)
   
5. WebSocket → Recipient Client
   - Receives message in real-time
   
6. Chat Service → API Gateway → Client
   - Returns MessageDto to sender
```

### WebSocket Connection Flow

```
1. Client connects to ws://localhost:8084/ws
   - Includes JWT in Authorization header
   
2. WebSocketAuthConfig intercepts CONNECT
   - Validates JWT
   - Sets authenticated user in session
   
3. WebSocketEventListener.handleWebSocketConnectListener()
   - Adds username to Redis "online-users" set
   - Deletes "last-seen:<username>" key
   - Broadcasts online users to /topic/public
   
4. All connected clients receive updated online users list
```

### Real-Time Message Delivery Flow

```
Option 1: REST API + Kafka
1. Client → POST /api/chat/messages
2. Message saved to DB
3. Message sent to Kafka
4. Kafka consumer sends via WebSocket
5. Recipient receives in real-time

Option 2: Direct WebSocket
1. Client → /app/chat.sendMessage (WebSocket)
2. Message sent directly via WebSocket
3. Recipient receives in real-time
(Note: This bypasses Kafka and database)
```

### Online Status Flow

```
1. User connects via WebSocket
   → Added to Redis "online-users" set
   → Broadcast to all clients
   
2. User disconnects
   → Removed from Redis "online-users" set
   → "last-seen:<username>" set to timestamp
   → Broadcast to all clients
   
3. Client queries status
   → POST /api/users/status
   → Auth Service checks Redis
   → Returns "online" or timestamp
```

---

## Key Design Decisions

1. **Microservices Architecture:** Separation of concerns (auth vs chat)
2. **JWT Authentication:** Stateless, scalable authentication
3. **Kafka for Async Messaging:** Decouples message saving from delivery
4. **Redis for Online Status:** Fast, in-memory storage for real-time data
5. **WebSocket for Real-Time:** Bidirectional communication for instant delivery
6. **Composite Keys:** MessageStatus and GroupUser use composite keys for many-to-many relationships
7. **Blocking Logic:** Prevents blocked users from sending messages
8. **Read Receipts:** Separate tracking for group messages (MessageStatus) vs private (Message status field)
9. **Conversation List:** Aggregates both private and group conversations
10. **API Gateway:** Single entry point with centralized JWT validation

---

## Security Considerations

1. **JWT Validation:** All protected endpoints validate JWT at gateway
2. **Password Encryption:** BCrypt for password hashing
3. **Role-Based Access:** Gateway checks for USER role
4. **WebSocket Authentication:** JWT validated on WebSocket connection
5. **Blocking:** Prevents communication between blocked users
6. **Group Membership:** Validates group membership before messaging
7. **CORS:** Configured for frontend origin only

---

This comprehensive analysis covers all aspects of your backend architecture, from models to API flows, including how Kafka, Redis, and WebSocket work together to provide real-time chat functionality.

