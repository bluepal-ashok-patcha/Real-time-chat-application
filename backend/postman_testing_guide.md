# Postman Testing Guide

This guide provides instructions on how to test the chat application's APIs using Postman.

## Prerequisites

-   Postman installed on your machine.
-   The chat application is running locally.

## API Endpoints

All endpoints are prefixed with `http://localhost:8080`.

### Authentication Service (`/api/auth`)

#### Register a new user

-   **Method:** `POST`
-   **Endpoint:** `/api/auth/register`
-   **Body (raw, JSON):**

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password"
}
```

#### Login

-   **Method:** `POST`
-   **Endpoint:** `/api/auth/login`
-   **Body (raw, JSON):**

```json
{
  "username": "testuser",
  "password": "password"
}
```

-   **Note:** Copy the `token` from the response body and use it in the `Authorization` header for all subsequent requests.

### User Service (`/api/users`)

-   **Header:** `Authorization: Bearer <your_jwt_token>`

#### Get user status

-   **Method:** `POST`
-   **Endpoint:** `/api/users/status`
-   **Body (raw, JSON):**

```json
{
  "userIds": [1, 2]
}
```

-   **Note:** Replace `1` and `2` with the IDs of the users you want to get the status of.

### Contact Service (`/api/contacts`)

-   **Header:** `Authorization: Bearer <your_jwt_token>`

#### Add a contact

-   **Method:** `POST`
-   **Endpoint:** `/api/contacts/{contactId}`
-   **Note:** Replace `{contactId}` with the ID of the user you want to add as a contact.

#### Get all contacts

-   **Method:** `GET`
-   **Endpoint:** `/api/contacts`

#### Remove a contact

-   **Method:** `DELETE`
-   **Endpoint:** `/api/contacts/{contactId}`
-   **Note:** Replace `{contactId}` with the ID of the user you want to remove from your contacts.

### Block Service (`/api/blocks`)

-   **Header:** `Authorization: Bearer <your_jwt_token>`

#### Block a user

-   **Method:** `POST`
-   **Endpoint:** `/api/blocks/{blockedUserId}`
-   **Note:** Replace `{blockedUserId}` with the ID of the user you want to block.

#### Get all blocked users

-   **Method:** `GET`
-   **Endpoint:** `/api/blocks`

#### Unblock a user

-   **Method:** `DELETE`
-   **Endpoint:** `/api/blocks/{blockedUserId}`
-   **Note:** Replace `{blockedUserId}` with the ID of the user you want to unblock.

### Chat Service (`/api/chat`)

-   **Header:** `Authorization: Bearer <your_jwt_token>`

#### Send a private message

-   **Method:** `POST`
-   **Endpoint:** `/api/chat/messages`
-   **Body (raw, JSON):**

```json
{
  "receiver": {
    "id": 2
  },
  "content": "Hello, world!"
}
```

-   **Note:** Replace `2` with the ID of the user you want to send a message to.

#### Send a group message

-   **Method:** `POST`
-   **Endpoint:** `/api/chat/messages`
-   **Body (raw, JSON):**

```json
{
  "groupId": 1,
  "content": "Hello, group!"
}
```

-   **Note:** Replace `1` with the ID of the group you want to send a message to.

#### Get message info

-   **Method:** `GET`
-   **Endpoint:** `/api/chat/messages/{messageId}/info`
-   **Note:** Replace `{messageId}` with the ID of the message you want to get information about.

### Group Service (`/api/groups`)

-   **Header:** `Authorization: Bearer <your_jwt_token>`

#### Create a group

-   **Method:** `POST`
-   **Endpoint:** `/api/groups`
-   **Body (raw, JSON):**

```json
{
  "name": "My Group"
}
```

#### Add a user to a group

-   **Method:** `POST`
-   **Endpoint:** `/api/groups/{groupId}/users/{userId}`
-   **Note:** Replace `{groupId}` and `{userId}` with the appropriate IDs.

#### Remove a user from a group

-   **Method:** `DELETE`
-   **Endpoint:** `/api/groups/{groupId}/users/{userId}`
-   **Note:** Replace `{groupId}` and `{userId}` with the appropriate IDs.
