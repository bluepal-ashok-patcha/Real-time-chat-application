package com.chatapp.chatservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Block {

    private Long id;

    private Long userId;

    private Long blockedUserId;

}
