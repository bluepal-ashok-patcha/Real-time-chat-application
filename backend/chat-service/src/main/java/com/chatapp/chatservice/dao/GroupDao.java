package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Group;

import java.util.List;

public interface GroupDao {
    List<Group> findByUserId(Long userId);
    Group findByGroupId(Long groupId);
}
