package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.ContactDto;
import com.chatapp.authservice.dto.AddContactResponse;
import com.chatapp.authservice.dto.AddContactRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContactService {

    ContactDto addContact(Long userId, Long contactId);

    AddContactResponse addContactByIdentifier(Long userId, AddContactRequest request);

    void removeContact(Long userId, Long contactId);

    Page<ContactDto> getContacts(Long userId, Pageable pageable);

    Page<ContactDto> getInviteContacts(Long userId, Pageable pageable);

    Page<ContactDto> getUserContacts(Long userId, Pageable pageable);

    Page<ContactDto> searchUserContacts(Long userId, String query, Pageable pageable);

    Page<ContactDto> searchInviteContacts(Long userId, String query, Pageable pageable);

}
