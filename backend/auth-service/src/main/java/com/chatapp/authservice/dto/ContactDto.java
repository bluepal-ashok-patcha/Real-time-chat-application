package com.chatapp.authservice.dto;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactDto {

    private Long id;

    private UserDto user;

    private UserDto contact;

    // For UX: when adding by identifier and user was not found
    private Boolean invite;

    // The identifier provided by the client (username/email/phone)
    private String identifier;

    // For displaying invite placeholder nicely
    private String inviteUsername;

    private String inviteEmail;
    
    
    private String phoneNumber;

}
