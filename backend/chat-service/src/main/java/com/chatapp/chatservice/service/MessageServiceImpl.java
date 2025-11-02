package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.kafka.KafkaProducer;
import com.chatapp.chatservice.model.Message;
import com.chatapp.chatservice.model.User;
import com.chatapp.chatservice.repository.MessageRepository;
import com.chatapp.chatservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final KafkaProducer kafkaProducer;
    private final UserRepository userRepository;

    public MessageServiceImpl(MessageRepository messageRepository, KafkaProducer kafkaProducer, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.kafkaProducer = kafkaProducer;
        this.userRepository = userRepository;
    }

    @Override
    public MessageDto sendMessage(MessageDto messageDto) {
        Message message = Message.builder()
                .senderId(messageDto.getSender().getId())
                .receiverId(messageDto.getReceiver().getId())
                .groupId(messageDto.getGroupId())
                .content(messageDto.getContent())
                .timestamp(messageDto.getTimestamp())
                .build();
        messageRepository.save(message);
        kafkaProducer.sendMessage(messageDto);
        return messageDto;
    }

    @Override
    public Page<MessageDto> getChatHistory(Long userId1, Long userId2, Pageable pageable) {
        Page<Message> messages = messageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampAsc(
                userId1, userId2, userId1, userId2, pageable);
        return messages.map(this::convertToDto);
    }

    @Override
    public Page<MessageDto> getGroupChatHistory(Long groupId, Pageable pageable) {
        Page<Message> messages = messageRepository.findByGroupIdOrderByTimestampAsc(groupId, pageable);
        return messages.map(this::convertToDto);
    }

    private MessageDto convertToDto(Message message) {
        User sender = userRepository.findById(message.getSenderId()).orElse(null);
        User receiver = message.getReceiverId() != null ? userRepository.findById(message.getReceiverId()).orElse(null) : null;
        return MessageDto.builder()
                .id(message.getId())
                .sender(sender != null ? UserDto.builder().id(sender.getId()).username(sender.getUsername()).build() : null)
                .receiver(receiver != null ? UserDto.builder().id(receiver.getId()).username(receiver.getUsername()).build() : null)
                .groupId(message.getGroupId())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .build();
    }

}
