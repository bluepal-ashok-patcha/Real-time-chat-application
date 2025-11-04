package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.AuthRequest;
import com.chatapp.authservice.dto.AuthResponse;
import com.chatapp.authservice.dto.ProfileUpdateRequest;
import com.chatapp.authservice.dto.RegisterRequest;
import com.chatapp.authservice.exception.UsernameAlreadyExistsException;
import com.chatapp.authservice.model.Role;
import com.chatapp.authservice.model.User;
import com.chatapp.authservice.repository.UserRepository;
import com.chatapp.authservice.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public User register(RegisterRequest registerRequest) {
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new UsernameAlreadyExistsException("Username is already taken");
        }

        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new UsernameAlreadyExistsException("Email is already taken");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.USER)
                .build();

        return userRepository.save(user);
    }

    @Override
    public AuthResponse login(AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).get();
        String jwt = jwtUtil.generateToken(user);

        return AuthResponse.builder().token(jwt).build();
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User updateProfile(Long userId, ProfileUpdateRequest profileUpdateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePictureUrl(profileUpdateRequest.getProfilePictureUrl());
        user.setAbout(profileUpdateRequest.getAbout());
        return userRepository.save(user);
    }
}
