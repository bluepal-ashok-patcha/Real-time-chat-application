package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.BlockDto;
import com.chatapp.authservice.service.BlockService;
import com.chatapp.authservice.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
public class BlockController {

    private final BlockService blockService;
    private final JwtUtil jwtUtil;

    public BlockController(BlockService blockService, JwtUtil jwtUtil) {
        this.blockService = blockService;
        this.jwtUtil = jwtUtil;
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        return jwtUtil.getUserIdFromToken(token);
    }

    @PostMapping("/{blockedUserId}")
    public ResponseEntity<BlockDto> blockUser(HttpServletRequest request, @PathVariable Long blockedUserId) {
        Long userId = getUserIdFromRequest(request);
        return ResponseEntity.ok(blockService.blockUser(userId, blockedUserId));
    }

    @DeleteMapping("/{blockedUserId}")
    public ResponseEntity<Void> unblockUser(HttpServletRequest request, @PathVariable Long blockedUserId) {
        Long userId = getUserIdFromRequest(request);
        blockService.unblockUser(userId, blockedUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<BlockDto>> getBlockedUsers(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        return ResponseEntity.ok(blockService.getBlockedUsers(userId));
    }

}
