package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dao.ContactDao;
import com.chatapp.chatservice.dao.UserDao;
import com.chatapp.chatservice.dto.GroupDto;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.model.Group;
import com.chatapp.chatservice.model.User;
import com.chatapp.chatservice.repository.GroupRepository;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final UserDao userDao;
    private final ContactDao contactDao;

    public GroupServiceImpl(GroupRepository groupRepository, UserDao userDao, ContactDao contactDao) {
        this.groupRepository = groupRepository;
        this.userDao = userDao;
        this.contactDao = contactDao;
    }

    @Override
    public GroupDto createGroup(GroupDto groupDto) {
        Group group = Group.builder()
                .name(groupDto.getName())
                .createdBy(groupDto.getCreatedBy())
                .build();
        groupRepository.save(group);
        return convertToDto(group);
    }

    @Override
    public GroupDto addUserToGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userDao.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (contactDao.findByUserIdAndContactId(group.getCreatedBy(), userId).isEmpty()) {
            throw new RuntimeException("You can only add your own contacts to a group");
        }
        group.getUsers().add(user);
        groupRepository.save(group);
        return convertToDto(group);
    }

    @Override
    public GroupDto removeUserFromGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userDao.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        group.getUsers().remove(user);
        groupRepository.save(group);
        return convertToDto(group);
    }

    private GroupDto convertToDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .createdBy(group.getCreatedBy())
                .users(group.getUsers().stream()
                        .map(user -> UserDto.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .build())
                        .collect(Collectors.toSet()))
                .build();
    }

}
