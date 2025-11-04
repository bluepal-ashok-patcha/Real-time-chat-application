package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.ContactDto;
import com.chatapp.authservice.dto.UserDto;
import com.chatapp.authservice.model.Contact;
import com.chatapp.authservice.model.User;
import com.chatapp.authservice.repository.ContactRepository;
import com.chatapp.authservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactServiceImpl(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ContactDto addContact(Long userId, Long contactId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        User contactUser = userRepository.findById(contactId).orElseThrow(() -> new RuntimeException("Contact not found"));
        Contact contact = Contact.builder()
                .user(user)
                .contact(contactUser)
                .build();
        contactRepository.save(contact);
        return convertToDto(contact);
    }

    @Override
    public void removeContact(Long userId, Long contactId) {
        Contact contact = contactRepository.findByUserIdAndContactId(userId, contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        contactRepository.delete(contact);
    }

    @Override
    public Page<ContactDto> getContacts(Long userId, Pageable pageable) {
        return contactRepository.findByUserId(userId, pageable).map(this::convertToDto);
    }

    private ContactDto convertToDto(Contact contact) {
        return ContactDto.builder()
                .id(contact.getId())
                .user(UserDto.builder()
                        .id(contact.getUser().getId())
                        .username(contact.getUser().getUsername())
                        .profilePictureUrl(contact.getUser().getProfilePictureUrl())
                        .about(contact.getUser().getAbout())
                        .build())
                .contact(UserDto.builder()
                        .id(contact.getContact().getId())
                        .username(contact.getContact().getUsername())
                        .profilePictureUrl(contact.getContact().getProfilePictureUrl())
                        .about(contact.getContact().getAbout())
                        .build())
                .build();
    }

}
