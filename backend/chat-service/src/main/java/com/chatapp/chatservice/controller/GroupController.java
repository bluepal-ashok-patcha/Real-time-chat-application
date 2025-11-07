package com.chatapp.chatservice.controller;

import com.chatapp.chatservice.dto.GroupDto;
import com.chatapp.chatservice.service.GroupService;
import com.chatapp.chatservice.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final JwtUtil jwtUtil;

    public GroupController(GroupService groupService, JwtUtil jwtUtil) {
        this.groupService = groupService;
        this.jwtUtil = jwtUtil;
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        return jwtUtil.getUserIdFromToken(token);
    }

    @PostMapping
    public ResponseEntity<GroupDto> createGroup(HttpServletRequest request, @RequestBody GroupDto groupDto) {
        Long creatorId = getUserIdFromRequest(request);
        groupDto.setCreatedBy(creatorId);
        return ResponseEntity.ok(groupService.createGroup(groupDto));
    }

    @PostMapping("/{groupId}/users/{userId}")
    public ResponseEntity<GroupDto> addUserToGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        return ResponseEntity.ok(groupService.addUserToGroup(groupId, userId));
    }

    @DeleteMapping("/{groupId}/users/{userId}")
    public ResponseEntity<GroupDto> removeUserFromGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        return ResponseEntity.ok(groupService.removeUserFromGroup(groupId, userId));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDto> getGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroup(groupId));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<GroupDto> updateGroup(@PathVariable Long groupId, @RequestBody GroupDto update) {
        return ResponseEntity.ok(groupService.updateGroup(groupId, update));
    }

}
