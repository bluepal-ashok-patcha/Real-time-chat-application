package com.chatapp.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddContactRequest {

    private String username;

    private String email;

    private String phoneNumber;

    // Also accept 'mobile' as alias for phoneNumber
    private String mobile;

    // Helper to get phone number from either field
    public String getPhoneNumberValue() {
        return phoneNumber != null && !phoneNumber.isEmpty() ? phoneNumber : mobile;
    }

}


