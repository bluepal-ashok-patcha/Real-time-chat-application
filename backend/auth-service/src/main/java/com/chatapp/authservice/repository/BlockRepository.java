package com.chatapp.authservice.repository;

import com.chatapp.authservice.model.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Long> {

    Page<Block> findByUserId(Long userId, Pageable pageable);

    Optional<Block> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);

}
