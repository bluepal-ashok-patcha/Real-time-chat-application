# Project Flow Documentation

This document provides a detailed explanation of the application's architecture and data flow.

## Architecture

The application is built using a microservices architecture, with the following services:

-   **Eureka Server:** A service discovery server that allows the other services to find and communicate with each other.
-   **API Gateway:** The single entry point for all client requests. It handles routing, authentication, and some security checks.
-   **Auth Service:** Manages user registration, login, and JWT generation. It also manages user contacts and blocked users.
-   **Chat Service:** Manages chat messages, groups, and real-time communication using WebSockets and Kafka.

## Data Flow

### User Authentication

1.  A new user registers by sending a `POST` request to `/api/auth/register`.
2.  The API Gateway forwards the request to the Auth Service.
3.  The Auth Service creates a new user in the database and returns a success response.
4.  The user logs in by sending a `POST` request to `/api/auth/login`.
5.  The API Gateway forwards the request to the Auth Service.
6.  The Auth Service validates the user's credentials and generates a JWT.
7.  The JWT is returned to the client, who must include it in the `Authorization` header for all subsequent requests.

### Message Sending

1.  A user sends a message by sending a `POST` request to `/api/chat/messages`.
2.  The API Gateway validates the JWT and forwards the request to the Chat Service.
3.  The Chat Service saves the message to the database with a `SENT` status.
4.  The Chat Service produces the message to a Kafka topic.
5.  A Kafka consumer in the Chat Service listens to the topic and receives the message.
6.  The consumer sends the message to the recipient over a WebSocket connection.

### Online Status

1.  When a user connects to the WebSocket, a `SessionConnectedEvent` is triggered.
2.  The `WebSocketEventListener` adds the user to a set of online users stored in Redis.
3.  The listener broadcasts the updated list of online users to all clients over a WebSocket connection.
4.  When a user disconnects, a `SessionDisconnectEvent` is triggered.
5.  The `WebSocketEventListener` removes the user from the set of online users in Redis.
6.  The listener broadcasts the updated list of online users to all clients over a WebSocket connection.
