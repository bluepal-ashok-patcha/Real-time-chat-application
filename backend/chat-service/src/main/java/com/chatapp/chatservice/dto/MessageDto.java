package com.chatapp.chatservice.dto;

import com.chatapp.chatservice.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {

    private Long id;

    private UserDto sender;

    private UserDto receiver;

    private Long groupId;

    private String content;

    private LocalDateTime timestamp;

    private MessageType type;

}
