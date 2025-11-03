package com.chatapp.authservice.controller;

import com.chatapp.authservice.dto.StatusDto;
import com.chatapp.authservice.dto.StatusRequest;
import com.chatapp.authservice.service.StatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class StatusController {

    private final StatusService statusService;

    public StatusController(StatusService statusService) {
        this.statusService = statusService;
    }

    @PostMapping("/status")
    public ResponseEntity<StatusDto> getStatus(@RequestBody StatusRequest statusRequest) {
        return ResponseEntity.ok(statusService.getStatus(statusRequest.getUserIds()));
    }
}
