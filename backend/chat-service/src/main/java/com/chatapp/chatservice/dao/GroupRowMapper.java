package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Group;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class GroupRowMapper implements RowMapper<Group> {
    @Override
    public Group mapRow(ResultSet rs, int rowNum) throws SQLException {
        Group group = new Group();
        group.setId(rs.getLong("id"));
        group.setName(rs.getString("name"));
        group.setCreatedBy(rs.getLong("created_by"));
        try {
            group.setDescription(rs.getString("description"));
        } catch (SQLException ignored) {
            // Column may not exist on older schemas
        }
        try {
            group.setImageUrl(rs.getString("image_url"));
        } catch (SQLException ignored) {
        }
        return group;
    }
}
