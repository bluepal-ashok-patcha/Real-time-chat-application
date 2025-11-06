package com.chatapp.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddContactResponse {

    private boolean found;   // user exists in system
    private boolean added;   // contact link created

    private String identifier; // original input

    private UserDto user;      // matched user when found
    private ContactDto contact; // contact relation when added

}


