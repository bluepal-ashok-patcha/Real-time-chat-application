package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.ContactDto;
import com.chatapp.authservice.dto.AddContactResponse;
import com.chatapp.authservice.dto.AddContactRequest;
import com.chatapp.authservice.dto.UserDto;
import com.chatapp.authservice.model.Contact;
import com.chatapp.authservice.model.User;
import com.chatapp.authservice.repository.ContactRepository;
import com.chatapp.authservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactServiceImpl(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ContactDto addContact(Long userId, Long contactId) {
        log.info("ContactService.addContact userId={} contactId={}", userId, contactId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        User contactUser = userRepository.findById(contactId).orElseThrow(() -> new RuntimeException("Contact not found"));
        Contact contact = Contact.builder()
                .user(user)
                .contact(contactUser)
                .invite(false) // Explicitly set to false for existing users
                .build();
        contactRepository.save(contact);
        log.debug("ContactService.addContact saved contact id={}", contact.getId());
        return convertToDto(contact);
    }

    @Override
    public void removeContact(Long userId, Long contactId) {
        log.info("ContactService.removeContact userId={} contactId={}", userId, contactId);
        Contact contact = contactRepository.findByUserIdAndContactId(userId, contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        contactRepository.delete(contact);
    }

    @Override
    public Page<ContactDto> getContacts(Long userId, Pageable pageable) {
        log.debug("ContactService.getContacts userId={} page={} size={}", userId, pageable.getPageNumber(), pageable.getPageSize());
        return contactRepository.findByUserId(userId, pageable).map(this::convertToDto);
    }

    @Override
    public Page<ContactDto> getInviteContacts(Long userId, Pageable pageable) {
        log.debug("ContactService.getInviteContacts userId={} page={} size={}", userId, pageable.getPageNumber(), pageable.getPageSize());
        return contactRepository.findByUserIdAndInvite(userId, true, pageable).map(this::convertToDto);
    }

    @Override
    public Page<ContactDto> getUserContacts(Long userId, Pageable pageable) {
        log.debug("ContactService.getUserContacts userId={} page={} size={}", userId, pageable.getPageNumber(), pageable.getPageSize());
        return contactRepository.findByUserIdAndInvite(userId, false, pageable).map(this::convertToDto);
    }

    @Override
    public Page<ContactDto> searchUserContacts(Long userId, String query, Pageable pageable) {
        log.debug("ContactService.searchUserContacts userId={} query={}", userId, query);
        return contactRepository.findByUserIdAndContact_UsernameContainingIgnoreCase(userId, query, pageable)
                .map(this::convertToDto);
    }

    @Override
    public Page<ContactDto> searchInviteContacts(Long userId, String query, Pageable pageable) {
        log.debug("ContactService.searchInviteContacts userId={} query={}", userId, query);
        return contactRepository.findByUserIdAndInviteTrueAndIdentifierContainingIgnoreCase(userId, query, pageable)
                .map(this::convertToDto);
    }

    @Override
    public AddContactResponse addContactByIdentifier(Long userId, AddContactRequest request) {
        log.info("ContactService.addContactByIdentifier userId={} identifierPref={} ", userId, request != null ? (request.getUsername()!=null?request.getUsername():request.getEmail()) : null);
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }

        // Extract identifier from any provided field
        String identifier = null;
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            identifier = request.getUsername().trim();
        } else if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            identifier = request.getEmail().trim();
        } else if (request.getPhoneNumberValue() != null && !request.getPhoneNumberValue().trim().isEmpty()) {
            identifier = request.getPhoneNumberValue().trim();
        }

        if (identifier == null || identifier.trim().isEmpty()) {
            throw new IllegalArgumentException("At least one identifier (username, email, or phoneNumber/mobile) is required");
        }

        String normalized = identifier.trim();

        // Try by username, email, phone number (in priority order)
        java.util.Optional<User> candidate = java.util.Optional.empty();
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            candidate = userRepository.findByUsername(request.getUsername().trim());
        }
        if (candidate.isEmpty() && request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            candidate = userRepository.findByEmail(request.getEmail().trim());
        }
        if (candidate.isEmpty() && request.getPhoneNumberValue() != null && !request.getPhoneNumberValue().trim().isEmpty()) {
            candidate = userRepository.findByPhoneNumber(request.getPhoneNumberValue().trim());
        }

        if (candidate.isPresent()) {
            User contactUser = candidate.get();
            // Check if already exists
            java.util.Optional<com.chatapp.authservice.model.Contact> existing =
                    contactRepository.findByUserIdAndContactId(userId, contactUser.getId());
            Contact contactEntity;
            boolean added;
            if (existing.isPresent()) {
                contactEntity = existing.get();
                // Ensure invite is explicitly false for existing user contacts
                if (contactEntity.getInvite() == null || contactEntity.getInvite()) {
                    contactEntity.setInvite(false);
                    contactEntity.setIdentifier(null);
                    contactEntity.setInviteUsername(null);
                    contactEntity.setInviteEmail(null);
                    contactRepository.save(contactEntity);
                }
                added = false;
            } else {
                User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
                contactEntity = Contact.builder()
                        .user(user)
                        .contact(contactUser)
                        .invite(false) // Explicitly set to false for existing users
                        .identifier(null)
                        .inviteUsername(null)
                        .inviteEmail(null)
                        .build();
                contactRepository.save(contactEntity);
                added = true;
            }

            ContactDto contactDto = convertToDto(contactEntity);
            return AddContactResponse.builder()
                    .found(true)
                    .added(added)
                    .identifier(normalized)
                    .user(UserDto.builder()
                            .id(contactUser.getId())
                            .username(contactUser.getUsername())
                            .email(contactUser.getEmail())
                            .profilePictureUrl(contactUser.getProfilePictureUrl())
                            .about(contactUser.getAbout())
                            .build())
                    .contact(contactDto)
                    .build();
        }

        // Not found: create a placeholder contact entry marked as invite
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Contact placeholder = Contact.builder()
                .user(user)
                .contact(null)
                .invite(true)
                .identifier(request != null && request.getUsername() != null && !request.getUsername().trim().isEmpty()
                        ? request.getUsername().trim() : normalized)
                .inviteUsername(request != null ? request.getUsername() : null)
                .inviteEmail(request != null ? request.getEmail() : null)
                .build();
        contactRepository.save(placeholder);
        log.debug("ContactService.addContactByIdentifier created invite placeholder id={}", placeholder.getId());

        ContactDto contactDto = ContactDto.builder()
                .id(placeholder.getId())
                .user(UserDto.builder().id(user.getId()).username(user.getUsername()).profilePictureUrl(user.getProfilePictureUrl()).about(user.getAbout()).build())
                .contact(null)
                .invite(true)
                .identifier(placeholder.getIdentifier())
                .inviteUsername(placeholder.getInviteUsername())
                .inviteEmail(placeholder.getInviteEmail())
                .build();

        return AddContactResponse.builder()
                .found(false)
                .added(true)
                .identifier(normalized)
                .contact(contactDto)
                .build();
    }

    private ContactDto convertToDto(Contact contact) {
        UserDto contactUserDto = null;
        if (contact.getContact() != null) {
            contactUserDto = UserDto.builder()
                    .id(contact.getContact().getId())
                    .username(contact.getContact().getUsername())
                    .profilePictureUrl(contact.getContact().getProfilePictureUrl())
                    .about(contact.getContact().getAbout())
                    .build();
        }

        return ContactDto.builder()
                .id(contact.getId())
                .user(UserDto.builder()
                        .id(contact.getUser().getId())
                        .username(contact.getUser().getUsername())
                        .profilePictureUrl(contact.getUser().getProfilePictureUrl())
                        .about(contact.getUser().getAbout())
                        .build())
                .contact(contactUserDto)
                .invite(Boolean.TRUE.equals(contact.getInvite()))
                .identifier(contact.getIdentifier())
                .inviteUsername(contact.getInviteUsername())
                .inviteEmail(contact.getInviteEmail())
                .build();
    }

}
