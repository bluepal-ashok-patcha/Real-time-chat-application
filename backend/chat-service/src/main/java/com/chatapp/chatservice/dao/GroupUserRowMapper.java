package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.GroupUser;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class GroupUserRowMapper implements RowMapper<GroupUser> {

    @Override
    public GroupUser mapRow(ResultSet rs, int rowNum) throws SQLException {
        GroupUser groupUser = new GroupUser();
        groupUser.setGroupId(rs.getLong("group_id"));
        groupUser.setUserId(rs.getLong("user_id"));
        return groupUser;
    }
}
