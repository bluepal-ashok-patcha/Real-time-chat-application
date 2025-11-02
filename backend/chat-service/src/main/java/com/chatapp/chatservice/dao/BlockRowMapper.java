package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Block;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class BlockRowMapper implements RowMapper<Block> {

    @Override
    public Block mapRow(ResultSet rs, int rowNum) throws SQLException {
        Block block = new Block();
        block.setId(rs.getLong("id"));
        block.setUserId(rs.getLong("user_id"));
        block.setBlockedUserId(rs.getLong("blocked_user_id"));
        return block;
    }
}
