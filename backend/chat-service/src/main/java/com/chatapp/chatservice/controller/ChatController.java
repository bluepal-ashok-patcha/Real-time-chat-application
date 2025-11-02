package com.chatapp.chatservice.controller;

import com.chatapp.chatservice.config.WebSocketEventListener;
import com.chatapp.chatservice.dto.ChatMessage;
import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.TypingNotification;
import com.chatapp.chatservice.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@Controller
@RequestMapping("/api/chat")
public class ChatController {

    private final MessageService messageService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final WebSocketEventListener webSocketEventListener;

    public ChatController(MessageService messageService, SimpMessageSendingOperations messagingTemplate, WebSocketEventListener webSocketEventListener) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
        this.webSocketEventListener = webSocketEventListener;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        if (chatMessage.getGroupId() != null) {
            messagingTemplate.convertAndSend("/topic/" + chatMessage.getGroupId(), chatMessage);
        } else {
            messagingTemplate.convertAndSendToUser(chatMessage.getReceiver(), "/queue/reply", chatMessage);
        }
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        webSocketEventListener.getOnlineUsers().add(chatMessage.getSender());
        chatMessage.setContent(String.join(",", webSocketEventListener.getOnlineUsers()));
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }

    @MessageMapping("/chat.typing")
    public void sendTypingNotification(@Payload TypingNotification typingNotification) {
        if (typingNotification.getGroupId() != null) {
            messagingTemplate.convertAndSend("/topic/" + typingNotification.getGroupId() + "/typing", typingNotification);
        } else {
            messagingTemplate.convertAndSendToUser(typingNotification.getReceiver(), "/queue/typing", typingNotification);
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageDto> sendMessage(@RequestHeader("id") Long senderId, @RequestBody MessageDto messageDto) {
        return ResponseEntity.ok(messageService.sendMessage(senderId, messageDto));
    }

    @GetMapping("/users/online")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(webSocketEventListener.getOnlineUsers());
    }

    @GetMapping("/messages/{userId1}/{userId2}")
    public ResponseEntity<Page<MessageDto>> getChatHistory(@PathVariable Long userId1, @PathVariable Long userId2,
                                                              Pageable pageable) {
        return ResponseEntity.ok(messageService.getChatHistory(userId1, userId2, pageable));
    }

    @GetMapping("/messages/{groupId}")
    public ResponseEntity<Page<MessageDto>> getGroupChatHistory(@PathVariable Long groupId, Pageable pageable) {
        return ResponseEntity.ok(messageService.getGroupChatHistory(groupId, pageable));
    }

    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markMessageAsRead(@PathVariable Long messageId) {
        messageService.markMessageAsRead(messageId);
        return ResponseEntity.ok().build();
    }

}
