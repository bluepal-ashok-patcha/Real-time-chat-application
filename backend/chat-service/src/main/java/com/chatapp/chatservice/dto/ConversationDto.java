package com.chatapp.chatservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {

    private Long id; // User ID for private chat, Group ID for group chat
    private String name; // Username or Group name
    private String type; // "PRIVATE" or "GROUP"
    private String lastMessage;
    private LocalDateTime lastMessageTimestamp;
    private long unreadCount;
    private String profilePictureUrl;
    // For WhatsApp-like ticks in conversation list (only relevant for private chats)
    private Long lastMessageSenderId;
    private com.chatapp.chatservice.model.MessageStatus.Status lastMessageStatus;

}
