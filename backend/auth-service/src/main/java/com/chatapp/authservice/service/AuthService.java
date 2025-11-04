package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.AuthRequest;
import com.chatapp.authservice.dto.AuthResponse;
import com.chatapp.authservice.dto.RegisterRequest;
import com.chatapp.authservice.model.User;

public interface AuthService {

    User register(RegisterRequest registerRequest);

    AuthResponse login(AuthRequest authRequest);

    User getUserById(Long id);

}
