package com.chatapp.chatservice.config;

import com.chatapp.chatservice.dto.ChatMessage;
import com.chatapp.chatservice.model.MessageType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Set;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private static final String ONLINE_USERS_KEY = "online-users";
    private static final String LAST_SEEN_KEY_PREFIX = "last-seen:";

    private final SimpMessageSendingOperations messagingTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate, RedisTemplate<String, String> redisTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("Received a new web socket connection");
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        if (headerAccessor.getUser() == null) {
            logger.warn("WebSocket connection without authenticated user");
            return;
        }
        
        String username = headerAccessor.getUser().getName();
        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, username);
        redisTemplate.delete(LAST_SEEN_KEY_PREFIX + username);
        
        // Safely handle session attributes
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("username", username);
        }

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setType(MessageType.JOIN);
        chatMessage.setSender(username);
        chatMessage.setContent(String.join(",", getOnlineUsers()));

        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = null;
        if (headerAccessor.getSessionAttributes() != null) {
            username = (String) headerAccessor.getSessionAttributes().get("username");
        }
        
        // If username not in session attributes, try to get from user principal
        if (username == null && headerAccessor.getUser() != null) {
            username = headerAccessor.getUser().getName();
        }
        
        if (username != null) {
            logger.info("User Disconnected : " + username);
            redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, username);
            redisTemplate.opsForValue().set(LAST_SEEN_KEY_PREFIX + username, String.valueOf(Instant.now().toEpochMilli()));

            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(MessageType.LEAVE);
            chatMessage.setSender(username);
            chatMessage.setContent(String.join(",", getOnlineUsers()));

            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

    public Set<String> getOnlineUsers() {
        return redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
    }
}
