package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.BlockDto;

import java.util.List;

public interface BlockService {

    BlockDto blockUser(Long userId, Long blockedUserId);

    void unblockUser(Long userId, Long blockedUserId);

    List<BlockDto> getBlockedUsers(Long userId);

}
