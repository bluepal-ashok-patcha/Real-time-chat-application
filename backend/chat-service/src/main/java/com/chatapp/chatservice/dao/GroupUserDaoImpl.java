package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.GroupUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GroupUserDaoImpl implements GroupUserDao {

    private final JdbcTemplate jdbcTemplate;

    public GroupUserDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void addUserToGroup(Long groupId, Long userId) {
        String sql = "INSERT INTO group_users (group_id, user_id) VALUES (?, ?)";
        jdbcTemplate.update(sql, groupId, userId);
    }

    @Override
    public void removeUserFromGroup(Long groupId, Long userId) {
        String sql = "DELETE FROM group_users WHERE group_id = ? AND user_id = ?";
        jdbcTemplate.update(sql, groupId, userId);
    }

    @Override
    public List<GroupUser> findByGroupId(Long groupId) {
        String sql = "SELECT * FROM group_users WHERE group_id = ?";
        return jdbcTemplate.query(sql, new GroupUserRowMapper(), groupId);
    }
}
