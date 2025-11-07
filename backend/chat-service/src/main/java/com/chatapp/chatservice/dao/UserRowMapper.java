package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.User;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class UserRowMapper implements RowMapper<User> {

    @Override
    public User mapRow(ResultSet rs, int rowNum) throws SQLException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        user.setProfilePictureUrl(rs.getString("profile_picture_url"));
        try {
            user.setAbout(rs.getString("about"));
        } catch (SQLException ignored) {
        }
        return user;
    }
}
