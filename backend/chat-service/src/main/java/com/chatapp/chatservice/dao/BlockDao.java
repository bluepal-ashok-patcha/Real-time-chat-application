package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Block;

import java.util.Optional;

public interface BlockDao {

    Optional<Block> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);

}
