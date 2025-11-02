package com.chatapp.chatservice.controller;

import com.chatapp.chatservice.dto.GroupDto;
import com.chatapp.chatservice.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public ResponseEntity<GroupDto> createGroup(@RequestHeader("id") Long creatorId, @RequestBody GroupDto groupDto) {
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

}
