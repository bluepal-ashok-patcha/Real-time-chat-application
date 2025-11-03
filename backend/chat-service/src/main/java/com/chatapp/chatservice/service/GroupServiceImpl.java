package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dao.ContactDao;
import com.chatapp.chatservice.dao.UserDao;
import com.chatapp.chatservice.dto.GroupDto;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.model.Group;
import com.chatapp.chatservice.model.GroupUser;
import com.chatapp.chatservice.repository.GroupRepository;
import com.chatapp.chatservice.repository.GroupUserRepository;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final UserDao userDao;
    private final ContactDao contactDao;
    private final GroupUserRepository groupUserRepository;

    public GroupServiceImpl(GroupRepository groupRepository, UserDao userDao, ContactDao contactDao,
                          GroupUserRepository groupUserRepository) {
        this.groupRepository = groupRepository;
        this.userDao = userDao;
        this.contactDao = contactDao;
        this.groupUserRepository = groupUserRepository;
    }

    @Override
    public GroupDto createGroup(GroupDto groupDto) {
        Group group = Group.builder()
                .name(groupDto.getName())
                .createdBy(groupDto.getCreatedBy())
                .build();
        groupRepository.save(group);
        groupUserRepository.save(GroupUser.builder().groupId(group.getId()).userId(group.getCreatedBy()).build());
        return convertToDto(group);
    }

    @Override
    public GroupDto addUserToGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        userDao.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (contactDao.findByUserIdAndContactId(group.getCreatedBy(), userId).isEmpty()) {
            throw new RuntimeException("You can only add your own contacts to a group");
        }
        groupUserRepository.save(GroupUser.builder().groupId(groupId).userId(userId).build());
        return convertToDto(group);
    }

    @Override
    public GroupDto removeUserFromGroup(Long groupId, Long userId) {
        groupUserRepository.deleteById(new GroupUser.GroupUserId(groupId, userId));
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        return convertToDto(group);
    }

    private GroupDto convertToDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .createdBy(group.getCreatedBy())
                .users(groupUserRepository.findByGroupId(group.getId()).stream()
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
