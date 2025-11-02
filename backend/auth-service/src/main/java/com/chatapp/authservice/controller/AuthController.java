package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.AuthRequest;
import com.chatapp.authservice.dto.AuthResponse;
import com.chatapp.authservice.dto.RegisterRequest;
import com.chatapp.authservice.dto.UserDto;
import com.chatapp.authservice.model.User;
import com.chatapp.authservice.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = authService.register(registerRequest);
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest authRequest) {
        return ResponseEntity.ok(authService.login(authRequest));
    }

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello from Auth Service");
    }

}
