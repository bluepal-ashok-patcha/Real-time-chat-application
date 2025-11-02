package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.ContactDto;
import com.chatapp.authservice.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping("/{contactId}")
    public ResponseEntity<ContactDto> addContact(@RequestHeader("id") Long userId, @PathVariable Long contactId) {
        return ResponseEntity.ok(contactService.addContact(userId, contactId));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> removeContact(@RequestHeader("id") Long userId, @PathVariable Long contactId) {
        contactService.removeContact(userId, contactId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<ContactDto>> getContacts(@RequestHeader("id") Long userId) {
        return ResponseEntity.ok(contactService.getContacts(userId));
    }

}
