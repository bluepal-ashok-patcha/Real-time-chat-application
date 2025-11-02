package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dao.ContactDao;
import com.chatapp.chatservice.dao.GroupUserDao;
import com.chatapp.chatservice.dao.UserDao;
import com.chatapp.chatservice.dto.GroupDto;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.model.Group;
import com.chatapp.chatservice.repository.GroupRepository;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final UserDao userDao;
    private final ContactDao contactDao;
    private final GroupUserDao groupUserDao;

    public GroupServiceImpl(GroupRepository groupRepository, UserDao userDao, ContactDao contactDao, GroupUserDao groupUserDao) {
        this.groupRepository = groupRepository;
        this.userDao = userDao;
        this.contactDao = contactDao;
        this.groupUserDao = groupUserDao;
    }

    @Override
    public GroupDto createGroup(GroupDto groupDto) {
        Group group = Group.builder()
                .name(groupDto.getName())
                .createdBy(groupDto.getCreatedBy())
                .build();
        groupRepository.save(group);
        groupUserDao.addUserToGroup(group.getId(), group.getCreatedBy());
        return convertToDto(group);
    }

    @Override
    public GroupDto addUserToGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        userDao.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (contactDao.findByUserIdAndContactId(group.getCreatedBy(), userId).isEmpty()) {
            throw new RuntimeException("You can only add your own contacts to a group");
        }
        groupUserDao.addUserToGroup(groupId, userId);
        return convertToDto(group);
    }

    @Override
    public GroupDto removeUserFromGroup(Long groupId, Long userId) {
        groupUserDao.removeUserFromGroup(groupId, userId);
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        return convertToDto(group);
    }

    private GroupDto convertToDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .createdBy(group.getCreatedBy())
                .users(groupUserDao.findByGroupId(group.getId()).stream()
                        .map(groupUser -> userDao.findById(groupUser.getUserId())
                                .map(user -> UserDto.builder()
                                        .id(user.getId())
                                        .username(user.getUsername())
                                        .build())
                                .orElse(null))
                        .collect(Collectors.toSet()))
                .build();
    }

}
