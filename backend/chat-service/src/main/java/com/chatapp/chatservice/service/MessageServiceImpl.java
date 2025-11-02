package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dao.BlockDao;
import com.chatapp.chatservice.dao.UserDao;
import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.kafka.KafkaProducer;
import com.chatapp.chatservice.model.Group;
import com.chatapp.chatservice.model.Message;
import com.chatapp.chatservice.model.User;
import com.chatapp.chatservice.repository.GroupRepository;
import com.chatapp.chatservice.repository.MessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final KafkaProducer kafkaProducer;
    private final UserDao userDao;
    private final BlockDao blockDao;
    private final GroupRepository groupRepository;

    public MessageServiceImpl(MessageRepository messageRepository, KafkaProducer kafkaProducer, UserDao userDao, BlockDao blockDao, GroupRepository groupRepository) {
        this.messageRepository = messageRepository;
        this.kafkaProducer = kafkaProducer;
        this.userDao = userDao;
        this.blockDao = blockDao;
        this.groupRepository = groupRepository;
    }

    @Override
    public MessageDto sendMessage(MessageDto messageDto) {
        if (messageDto.getGroupId() != null) {
            Group group = groupRepository.findById(messageDto.getGroupId()).orElseThrow(() -> new RuntimeException("Group not found"));
            if (group.getUsers().stream().noneMatch(user -> user.getId().equals(messageDto.getSender().getId()))) {
                throw new RuntimeException("You are not a member of this group");
            }
        } else {
            if (blockDao.findByUserIdAndBlockedUserId(messageDto.getReceiver().getId(), messageDto.getSender().getId()).isPresent()) {
                throw new RuntimeException("You have been blocked by this user");
            }
        }
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
        User sender = userDao.findById(message.getSenderId()).orElse(null);
        User receiver = message.getReceiverId() != null ? userDao.findById(message.getReceiverId()).orElse(null) : null;
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
