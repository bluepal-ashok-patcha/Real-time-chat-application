package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.BlockDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BlockService {

    BlockDto blockUser(Long userId, Long blockedUserId);

    void unblockUser(Long userId, Long blockedUserId);

    Page<BlockDto> getBlockedUsers(Long userId, Pageable pageable);

}
