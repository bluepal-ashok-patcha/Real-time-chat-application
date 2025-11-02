package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.ContactDto;

import java.util.List;

public interface ContactService {

    ContactDto addContact(Long userId, Long contactId);

    void removeContact(Long userId, Long contactId);

    List<ContactDto> getContacts(Long userId);

}
