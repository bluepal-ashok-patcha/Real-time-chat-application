package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Contact;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ContactDaoImpl implements ContactDao {

    private final JdbcTemplate jdbcTemplate;

    public ContactDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Contact> findByUserIdAndContactId(Long userId, Long contactId) {
        String sql = "SELECT * FROM contacts WHERE user_id = ? AND contact_id = ?";
        return jdbcTemplate.query(sql, new ContactRowMapper(), userId, contactId).stream().findFirst();
    }

    @Override
    public List<Contact> findByUserId(Long userId) {
        String sql = "SELECT * FROM contacts WHERE user_id = ?";
        return jdbcTemplate.query(sql, new ContactRowMapper(), userId);
    }
}
