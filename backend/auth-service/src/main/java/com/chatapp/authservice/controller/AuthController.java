package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.AuthRequest;
import com.chatapp.authservice.dto.AuthResponse;
import com.chatapp.authservice.dto.ProfileUpdateRequest;
import com.chatapp.authservice.dto.RegisterRequest;
import com.chatapp.authservice.dto.UserDto;
import com.chatapp.authservice.model.User;
import com.chatapp.authservice.service.AuthService;
import com.chatapp.authservice.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = authService.register(registerRequest);
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest authRequest) {
        return ResponseEntity.ok(authService.login(authRequest));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        Long userId = jwtUtil.getUserIdFromToken(token);
        User user = authService.getUserById(userId);
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePictureUrl(user.getProfilePictureUrl())
                .about(user.getAbout())
                .build();
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(HttpServletRequest request, @Valid @RequestBody ProfileUpdateRequest profileUpdateRequest) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        Long userId = jwtUtil.getUserIdFromToken(token);
        User user = authService.updateProfile(userId, profileUpdateRequest);
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePictureUrl(user.getProfilePictureUrl())
                .about(user.getAbout())
                .build();
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/hello")
    public ResponseEntity<String> hello(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        Long userId = jwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok("Hello from Auth Service, user id: " + userId);
    }

}
