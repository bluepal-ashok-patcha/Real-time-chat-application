package com.chatapp.chatservice.kafka;

import com.chatapp.chatservice.dto.MessageDto;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

@Component
public class MessageListener {

    private final SimpMessageSendingOperations messagingTemplate;

    public MessageListener(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = "messages", groupId = "messaging-group")
    public void listen(MessageDto messageDto) {
        if (messageDto.getGroupId() != null) {
            messagingTemplate.convertAndSend("/topic/" + messageDto.getGroupId(), messageDto);
        } else {
            messagingTemplate.convertAndSendToUser(messageDto.getReceiver().getUsername(), "/queue/reply", messageDto);
        }
    }
}
