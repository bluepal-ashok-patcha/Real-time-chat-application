package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.GroupUser;

import java.util.List;

public interface GroupUserDao {

    void addUserToGroup(Long groupId, Long userId);

    void removeUserFromGroup(Long groupId, Long userId);

    List<GroupUser> findByGroupId(Long groupId);

}
