package com.chatapp.chatservice.dto;

import com.chatapp.chatservice.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    private MessageType type;
    private String content;
    private String sender;
    private String receiver;
    private Long groupId;
}
