package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.BlockDto;
import com.chatapp.authservice.dto.UserDto;
import com.chatapp.authservice.model.Block;
import com.chatapp.authservice.model.User;
import com.chatapp.authservice.repository.BlockRepository;
import com.chatapp.authservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BlockServiceImpl implements BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public BlockServiceImpl(BlockRepository blockRepository, UserRepository userRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    @Override
    public BlockDto blockUser(Long userId, Long blockedUserId) {
        log.info("BlockService.blockUser userId={} blockedUserId={}", userId, blockedUserId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        User blockedUser = userRepository.findById(blockedUserId).orElseThrow(() -> new RuntimeException("Blocked user not found"));
        Block block = Block.builder()
                .user(user)
                .blockedUser(blockedUser)
                .build();
        blockRepository.save(block);
        log.debug("BlockService.blockUser created block id={}", block.getId());
        return convertToDto(block);
    }

    @Override
    public void unblockUser(Long userId, Long blockedUserId) {
        log.info("BlockService.unblockUser userId={} blockedUserId={}", userId, blockedUserId);
        Block block = blockRepository.findByUserIdAndBlockedUserId(userId, blockedUserId)
                .orElseThrow(() -> new RuntimeException("Block not found"));
        blockRepository.delete(block);
    }

    @Override
    public Page<BlockDto> getBlockedUsers(Long userId, Pageable pageable) {
        log.debug("BlockService.getBlockedUsers userId={} page={} size={}", userId, pageable.getPageNumber(), pageable.getPageSize());
        return blockRepository.findByUserId(userId, pageable).map(this::convertToDto);
    }

    private BlockDto convertToDto(Block block) {
        return BlockDto.builder()
                .id(block.getId())
                .user(UserDto.builder()
                        .id(block.getUser().getId())
                        .username(block.getUser().getUsername())
                        .build())
                .blockedUser(UserDto.builder()
                        .id(block.getBlockedUser().getId())
                        .username(block.getBlockedUser().getUsername())
                        .build())
                .build();
    }

}
