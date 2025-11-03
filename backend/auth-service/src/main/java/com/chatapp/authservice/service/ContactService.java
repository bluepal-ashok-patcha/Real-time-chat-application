package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.ContactDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContactService {

    ContactDto addContact(Long userId, Long contactId);

    void removeContact(Long userId, Long contactId);

    Page<ContactDto> getContacts(Long userId, Pageable pageable);

}
