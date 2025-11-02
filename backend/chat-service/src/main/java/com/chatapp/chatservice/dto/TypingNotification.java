package com.chatapp.chatservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingNotification {

    private String sender;

    private String receiver;

    private Long groupId;

    private boolean typing;

}
