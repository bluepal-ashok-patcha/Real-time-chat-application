package com.chatapp.authservice.repository;

import com.chatapp.authservice.model.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Long> {

    List<Block> findByUserId(Long userId);

    Optional<Block> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);

}
