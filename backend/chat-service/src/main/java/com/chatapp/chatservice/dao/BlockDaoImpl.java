package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Block;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class BlockDaoImpl implements BlockDao {

    private final JdbcTemplate jdbcTemplate;

    public BlockDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Block> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId) {
        String sql = "SELECT * FROM blocks WHERE user_id = ? AND blocked_user_id = ?";
        return jdbcTemplate.query(sql, new BlockRowMapper(), userId, blockedUserId).stream().findFirst();
    }
}
