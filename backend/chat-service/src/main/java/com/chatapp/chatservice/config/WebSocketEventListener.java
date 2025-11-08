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
    private static final String SESSION_USER_KEY_PREFIX = "session-user:";
    private static final String USER_SESSION_KEY_PREFIX = "user-session:";

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
        String sessionId = headerAccessor.getSessionId();
        
        // Track session-to-user mapping for cleanup purposes
        if (sessionId != null) {
            redisTemplate.opsForValue().set(SESSION_USER_KEY_PREFIX + sessionId, username, java.time.Duration.ofMinutes(30));
            redisTemplate.opsForSet().add(USER_SESSION_KEY_PREFIX + username, sessionId);
        }
        
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
        
        // Also try to get from session ID if available
        if (username == null && headerAccessor.getSessionId() != null) {
            logger.warn("Disconnect event received but username not found. Session ID: " + headerAccessor.getSessionId());
        }
        
        String sessionId = headerAccessor.getSessionId();
        
        if (username != null) {
            logger.info("User Disconnected : " + username + " (Session: " + sessionId + ")");
            handleUserDisconnect(username, sessionId);
        } else {
            // Try to get username from session tracking
            if (sessionId != null) {
                String trackedUsername = redisTemplate.opsForValue().get(SESSION_USER_KEY_PREFIX + sessionId);
                if (trackedUsername != null) {
                    logger.info("User Disconnected (from session tracking): " + trackedUsername + " (Session: " + sessionId + ")");
                    handleUserDisconnect(trackedUsername, sessionId);
                } else {
                    logger.warn("Could not determine username for disconnect event. Session ID: " + sessionId);
                }
            } else {
                logger.warn("Could not determine username for disconnect event. Session ID: unknown");
            }
        }
    }
    
    /**
     * Handles user disconnect by removing from online users and broadcasting update
     */
    private void handleUserDisconnect(String username, String sessionId) {
        try {
            // Clean up session tracking
            if (sessionId != null) {
                redisTemplate.delete(SESSION_USER_KEY_PREFIX + sessionId);
            }
            
            // Remove session from user's session set
            if (sessionId != null) {
                redisTemplate.opsForSet().remove(USER_SESSION_KEY_PREFIX + username, sessionId);
            }
            
            // Check if user has any remaining active sessions
            Set<String> remainingSessions = redisTemplate.opsForSet().members(USER_SESSION_KEY_PREFIX + username);
            if (remainingSessions == null || remainingSessions.isEmpty()) {
                // No more active sessions, mark user as offline
            redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, username);
            redisTemplate.opsForValue().set(LAST_SEEN_KEY_PREFIX + username, String.valueOf(Instant.now().toEpochMilli()));
                
                // Clean up user session tracking key
                redisTemplate.delete(USER_SESSION_KEY_PREFIX + username);

            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(MessageType.LEAVE);
            chatMessage.setSender(username);
            chatMessage.setContent(String.join(",", getOnlineUsers()));

            messagingTemplate.convertAndSend("/topic/public", chatMessage);
            } else {
                logger.debug("User {} still has {} active session(s)", username, remainingSessions.size());
            }
        } catch (Exception e) {
            logger.error("Error handling user disconnect for " + username, e);
        }
    }

    public Set<String> getOnlineUsers() {
        return redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
    }
}
