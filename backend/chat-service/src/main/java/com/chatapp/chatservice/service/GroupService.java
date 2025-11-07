package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dto.GroupDto;

public interface GroupService {

    GroupDto createGroup(GroupDto groupDto);

    GroupDto addUserToGroup(Long groupId, Long userId);

    GroupDto removeUserFromGroup(Long groupId, Long userId);

    GroupDto getGroup(Long groupId);

    GroupDto updateGroup(Long groupId, GroupDto update);

}
