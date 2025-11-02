package com.chatapp.chatservice.controller;

import com.chatapp.chatservice.config.WebSocketEventListener;
import com.chatapp.chatservice.dto.ChatMessage;
import com.chatapp.chatservice.dto.MessageDto;
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

    public ChatController(MessageService messageService, SimpMessageSendingOperations messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
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
        WebSocketEventListener.getOnlineUsers().add(chatMessage.getSender());
        chatMessage.setContent(String.join(",", WebSocketEventListener.getOnlineUsers()));
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageDto> sendMessage(@RequestBody MessageDto messageDto) {
        return ResponseEntity.ok(messageService.sendMessage(messageDto));
    }

    @GetMapping("/users/online")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(WebSocketEventListener.getOnlineUsers());
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

}
