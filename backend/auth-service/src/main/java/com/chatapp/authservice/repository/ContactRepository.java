package com.chatapp.authservice.repository;

import com.chatapp.authservice.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByUserId(Long userId);

    Optional<Contact> findByUserIdAndContactId(Long userId, Long contactId);

}
