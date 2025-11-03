package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.StatusDto;

import java.util.List;

public interface StatusService {

    StatusDto getStatus(List<Long> userIds);

}
