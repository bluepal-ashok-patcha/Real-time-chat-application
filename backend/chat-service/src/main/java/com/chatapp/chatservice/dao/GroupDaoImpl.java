package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Group;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GroupDaoImpl implements GroupDao {

    private final JdbcTemplate jdbcTemplate;

    public GroupDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<Group> findByUserId(Long userId) {
        String sql = "SELECT g.* FROM `groups` g JOIN group_users gu ON g.id = gu.group_id WHERE gu.user_id = ?";
        return jdbcTemplate.query(sql, new GroupRowMapper(), userId);
    }

    @Override
    public Group findByGroupId(Long groupId) {
        String sql = "SELECT * FROM `groups` WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, new GroupRowMapper(), groupId);
    }
}
