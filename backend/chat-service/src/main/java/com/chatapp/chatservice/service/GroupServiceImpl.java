package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dto.GroupDto;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.model.Group;
import com.chatapp.chatservice.model.User;
import com.chatapp.chatservice.repository.GroupRepository;
import com.chatapp.chatservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public GroupServiceImpl(GroupRepository groupRepository, UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    @Override
    public GroupDto createGroup(GroupDto groupDto) {
        Group group = Group.builder()
                .name(groupDto.getName())
                .build();
        groupRepository.save(group);
        return convertToDto(group);
    }

    @Override
    public GroupDto addUserToGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        group.getUsers().add(user);
        groupRepository.save(group);
        return convertToDto(group);
    }

    @Override
    public GroupDto removeUserFromGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        group.getUsers().remove(user);
        groupRepository.save(group);
        return convertToDto(group);
    }

    private GroupDto convertToDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .users(group.getUsers().stream()
                        .map(user -> UserDto.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .build())
                        .collect(Collectors.toSet()))
                .build();
    }

}
