package com.chatapp.authservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "contacts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "contact_id")
    private User contact;

    // For contacts that are not registered users yet
    private Boolean invite;

    // The plain identifier provided by the client (username/email/phone)
    private String identifier;

    // Optional: saved display name/email for invite contacts
    private String inviteUsername;

    private String inviteEmail;

}
