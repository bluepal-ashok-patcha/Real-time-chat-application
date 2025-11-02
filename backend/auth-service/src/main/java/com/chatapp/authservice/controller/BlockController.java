package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.BlockDto;
import com.chatapp.authservice.service.BlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
public class BlockController {

    private final BlockService blockService;

    public BlockController(BlockService blockService) {
        this.blockService = blockService;
    }

    @PostMapping("/{blockedUserId}")
    public ResponseEntity<BlockDto> blockUser(@RequestHeader("id") Long userId, @PathVariable Long blockedUserId) {
        return ResponseEntity.ok(blockService.blockUser(userId, blockedUserId));
    }

    @DeleteMapping("/{blockedUserId}")
    public ResponseEntity<Void> unblockUser(@RequestHeader("id") Long userId, @PathVariable Long blockedUserId) {
        blockService.unblockUser(userId, blockedUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<BlockDto>> getBlockedUsers(@RequestHeader("id") Long userId) {
        return ResponseEntity.ok(blockService.getBlockedUsers(userId));
    }

}
