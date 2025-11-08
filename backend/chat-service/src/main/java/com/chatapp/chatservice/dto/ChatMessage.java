package com.chatapp.chatservice.dto;

import com.chatapp.chatservice.model.MessageType;

import jakarta.validation.constraints.NotBlank;
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
    @NotBlank(message = "content is required")
    private String content;
    private String sender;
    private String receiver;
    private Long groupId;
}
