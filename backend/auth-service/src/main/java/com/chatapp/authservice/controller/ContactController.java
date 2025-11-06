package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.ContactDto;
import com.chatapp.authservice.dto.AddContactRequest;
import com.chatapp.authservice.dto.AddContactResponse;
import com.chatapp.authservice.service.ContactService;
import com.chatapp.authservice.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;
    private final JwtUtil jwtUtil;
    private final com.chatapp.authservice.service.EmailService emailService;

    public ContactController(ContactService contactService, JwtUtil jwtUtil, com.chatapp.authservice.service.EmailService emailService) {
        this.contactService = contactService;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        return jwtUtil.getUserIdFromToken(token);
    }

    @PostMapping("/{contactId}")
    public ResponseEntity<ContactDto> addContact(HttpServletRequest request, @PathVariable Long contactId) {
        Long userId = getUserIdFromRequest(request);
        return ResponseEntity.ok(contactService.addContact(userId, contactId));
    }

    // Add contact by username/email/phone number. If user not found, returns invite suggestion.
    @PostMapping("/add-by-identifier")
    public ResponseEntity<AddContactResponse> addContactByIdentifier(HttpServletRequest request,
                                                                     @RequestBody AddContactRequest body) {
        Long userId = getUserIdFromRequest(request);
        return ResponseEntity.ok(contactService.addContactByIdentifier(userId, body));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> removeContact(HttpServletRequest request, @PathVariable Long contactId) {
        Long userId = getUserIdFromRequest(request);
        contactService.removeContact(userId, contactId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<ContactDto>> getContacts(HttpServletRequest request,
                                                        @RequestParam(value = "q", required = false) String query,
                                                        @RequestParam(value = "type", required = false) String type,
                                                        Pageable pageable) {
        Long userId = getUserIdFromRequest(request);
        if (query != null && !query.isBlank()) {
            if ("INVITE".equalsIgnoreCase(type)) {
                return ResponseEntity.ok(contactService.searchInviteContacts(userId, query, pageable));
            }
            return ResponseEntity.ok(contactService.searchUserContacts(userId, query, pageable));
        }
        if (type != null) {
            if ("INVITE".equalsIgnoreCase(type)) {
                return ResponseEntity.ok(contactService.getInviteContacts(userId, pageable));
            }
            if ("USER".equalsIgnoreCase(type)) {
                return ResponseEntity.ok(contactService.getUserContacts(userId, pageable));
            }
        }
        return ResponseEntity.ok(contactService.getContacts(userId, pageable));
    }

    // Send invitation email to provided email address
    @PostMapping("/invite")
    public ResponseEntity<Void> sendInvite(HttpServletRequest request, @RequestParam("email") String email) {
        Long userId = getUserIdFromRequest(request);
        // For email content, we want inviter's username
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        String inviterUsername = jwtUtil.getUserNameFromJwtToken(token);
        emailService.sendInviteEmail(email, inviterUsername);
        return ResponseEntity.ok().build();
    }

}
