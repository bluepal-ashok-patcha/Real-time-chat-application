package com.chatapp.authservice.service;

import com.chatapp.authservice.dto.StatusDto;
import com.chatapp.authservice.repository.UserRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class StatusServiceImpl implements StatusService {

    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    public StatusServiceImpl(RedisTemplate<String, String> redisTemplate, UserRepository userRepository) {
        this.redisTemplate = redisTemplate;
        this.userRepository = userRepository;
    }

    @Override
    public StatusDto getStatus(List<Long> userIds) {
        Map<Long, String> status = new HashMap<>();
        Set<String> onlineUsers = redisTemplate.opsForSet().members("online-users");
        for (Long userId : userIds) {
            String username = userRepository.findById(userId).get().getUsername();
            if (onlineUsers.contains(username)) {
                status.put(userId, "online");
            } else {
                String lastSeen = redisTemplate.opsForValue().get("last-seen:" + username);
                status.put(userId, lastSeen != null ? lastSeen : "offline");
            }
        }
        return StatusDto.builder().status(status).build();
    }
}
