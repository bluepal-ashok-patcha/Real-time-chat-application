package com.chatapp.authservice.repository;

import com.chatapp.authservice.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    Page<Contact> findByUserId(Long userId, Pageable pageable);

    Optional<Contact> findByUserIdAndContactId(Long userId, Long contactId);

    Page<Contact> findByUserIdAndInvite(Long userId, Boolean invite, Pageable pageable);

    Page<Contact> findByUserIdAndContact_UsernameContainingIgnoreCase(Long userId, String username, Pageable pageable);

    Page<Contact> findByUserIdAndInviteTrueAndIdentifierContainingIgnoreCase(Long userId, String identifier, Pageable pageable);

}
