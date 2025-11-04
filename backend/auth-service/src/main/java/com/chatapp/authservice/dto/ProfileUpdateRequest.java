package com.chatapp.authservice.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String profilePictureUrl;
    private String about;
}
