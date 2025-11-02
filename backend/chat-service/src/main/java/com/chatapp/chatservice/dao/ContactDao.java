package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.Contact;

import java.util.List;
import java.util.Optional;

public interface ContactDao {

    Optional<Contact> findByUserIdAndContactId(Long userId, Long contactId);

    List<Contact> findByUserId(Long userId);

}
