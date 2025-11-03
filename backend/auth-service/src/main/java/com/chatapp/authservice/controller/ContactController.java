package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.ContactDto;
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

    public ContactController(ContactService contactService, JwtUtil jwtUtil) {
        this.contactService = contactService;
        this.jwtUtil = jwtUtil;
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

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> removeContact(HttpServletRequest request, @PathVariable Long contactId) {
        Long userId = getUserIdFromRequest(request);
        contactService.removeContact(userId, contactId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<ContactDto>> getContacts(HttpServletRequest request, Pageable pageable) {
        Long userId = getUserIdFromRequest(request);
        return ResponseEntity.ok(contactService.getContacts(userId, pageable));
    }

}
