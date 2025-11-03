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

@Service
public class BlockServiceImpl implements BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public BlockServiceImpl(BlockRepository blockRepository, UserRepository userRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    @Override
    public BlockDto blockUser(Long userId, Long blockedUserId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        User blockedUser = userRepository.findById(blockedUserId).orElseThrow(() -> new RuntimeException("Blocked user not found"));
        Block block = Block.builder()
                .user(user)
                .blockedUser(blockedUser)
                .build();
        blockRepository.save(block);
        return convertToDto(block);
    }

    @Override
    public void unblockUser(Long userId, Long blockedUserId) {
        Block block = blockRepository.findByUserIdAndBlockedUserId(userId, blockedUserId)
                .orElseThrow(() -> new RuntimeException("Block not found"));
        blockRepository.delete(block);
    }

    @Override
    public Page<BlockDto> getBlockedUsers(Long userId, Pageable pageable) {
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
