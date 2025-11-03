package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dao.BlockDao;
import com.chatapp.chatservice.dao.UserDao;
import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.ReadReceipt;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.kafka.KafkaProducer;
import com.chatapp.chatservice.model.Message;
import com.chatapp.chatservice.model.MessageStatus;
import com.chatapp.chatservice.repository.GroupUserRepository;
import com.chatapp.chatservice.repository.MessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final KafkaProducer kafkaProducer;
    private final UserDao userDao;
    private final BlockDao blockDao;
    private final GroupUserRepository groupUserRepository;

    public MessageServiceImpl(MessageRepository messageRepository, KafkaProducer kafkaProducer, UserDao userDao,
                              BlockDao blockDao, GroupUserRepository groupUserRepository) {
        this.messageRepository = messageRepository;
        this.kafkaProducer = kafkaProducer;
        this.userDao = userDao;
        this.blockDao = blockDao;
        this.groupUserRepository = groupUserRepository;
    }

    @Override
    public MessageDto sendMessage(Long senderId, MessageDto messageDto) {
        messageDto.setSender(UserDto.builder().id(senderId).build());
        if (messageDto.getGroupId() != null) {
            if (groupUserRepository.findByGroupId(messageDto.getGroupId()).stream()
                    .noneMatch(groupUser -> groupUser.getUserId().equals(senderId))) {
                throw new RuntimeException("You are not a member of this group");
            }
        } else {
            if (blockDao.findByUserIdAndBlockedUserId(messageDto.getReceiver().getId(), senderId).isPresent()) {
                throw new RuntimeException("You have been blocked by this user");
            }
        }
        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(messageDto.getReceiver().getId())
                .groupId(messageDto.getGroupId())
                .content(messageDto.getContent())
                .timestamp(LocalDateTime.now())
                .status(MessageStatus.SENT)
                .build();
        Message savedMessage = messageRepository.save(message);
        kafkaProducer.sendMessage(convertToDto(savedMessage));
        return convertToDto(savedMessage);
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

    @Override
    public void markMessageAsRead(Long userId, Long messageId) {
        Message message = messageRepository.findById(messageId).orElseThrow(() -> new RuntimeException("Message not found"));
        if (message.getGroupId() != null) {
            if (groupUserRepository.findByGroupId(message.getGroupId()).stream()
                    .noneMatch(groupUser -> groupUser.getUserId().equals(userId))) {
                throw new RuntimeException("You are not a member of this group");
            }
        } else {
            if (!message.getReceiverId().equals(userId)) {
                throw new RuntimeException("You are not authorized to mark this message as read");
            }
        }
        message.setStatus(MessageStatus.READ);
        messageRepository.save(message);
        kafkaProducer.sendReadReceipt(ReadReceipt.builder()
                .messageId(messageId)
                .sender(userDao.findById(message.getSenderId()).get().getUsername())
                .receiver(userDao.findById(message.getReceiverId()).get().getUsername())
                .build());
    }

    private MessageDto convertToDto(Message message) {
        UserDto sender = userDao.findById(message.getSenderId())
                .map(user -> UserDto.builder().id(user.getId()).username(user.getUsername()).build())
                .orElse(null);
        UserDto receiver = message.getReceiverId() != null ? userDao.findById(message.getReceiverId())
                .map(user -> UserDto.builder().id(user.getId()).username(user.getUsername()).build())
                .orElse(null) : null;
        return MessageDto.builder()
                .id(message.getId())
                .sender(sender)
                .receiver(receiver)
                .groupId(message.getGroupId())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .status(message.getStatus())
                .build();
    }

}
