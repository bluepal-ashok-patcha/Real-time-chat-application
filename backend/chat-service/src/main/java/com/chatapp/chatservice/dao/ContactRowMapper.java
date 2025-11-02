package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Contact;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class ContactRowMapper implements RowMapper<Contact> {

    @Override
    public Contact mapRow(ResultSet rs, int rowNum) throws SQLException {
        Contact contact = new Contact();
        contact.setId(rs.getLong("id"));
        contact.setUserId(rs.getLong("user_id"));
        contact.setContactId(rs.getLong("contact_id"));
        return contact;
    }
}
