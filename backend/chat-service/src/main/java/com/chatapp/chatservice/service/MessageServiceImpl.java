package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dao.BlockDao;
import com.chatapp.chatservice.dao.UserDao;
import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.MessageInfoDto;
import com.chatapp.chatservice.dto.ReadReceipt;
import com.chatapp.chatservice.dto.UserDto;
import com.chatapp.chatservice.kafka.KafkaProducer;
import com.chatapp.chatservice.model.Message;
import com.chatapp.chatservice.model.MessageStatus;
import com.chatapp.chatservice.repository.GroupUserRepository;
import com.chatapp.chatservice.repository.MessageRepository;
import com.chatapp.chatservice.repository.MessageStatusRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final KafkaProducer kafkaProducer;
    private final UserDao userDao;
    private final BlockDao blockDao;
    private final com.chatapp.chatservice.dao.ContactDao contactDao;
    private final com.chatapp.chatservice.dao.GroupDao groupDao;
    private final GroupUserRepository groupUserRepository;
    private final MessageStatusRepository messageStatusRepository;

    public MessageServiceImpl(MessageRepository messageRepository, KafkaProducer kafkaProducer, UserDao userDao,
                              BlockDao blockDao, com.chatapp.chatservice.dao.ContactDao contactDao,
                              com.chatapp.chatservice.dao.GroupDao groupDao, GroupUserRepository groupUserRepository,
                              MessageStatusRepository messageStatusRepository) {
        this.messageRepository = messageRepository;
        this.kafkaProducer = kafkaProducer;
        this.userDao = userDao;
        this.blockDao = blockDao;
        this.contactDao = contactDao;
        this.groupDao = groupDao;
        this.groupUserRepository = groupUserRepository;
        this.messageStatusRepository = messageStatusRepository;
    }

    @Override
    public MessageDto sendMessage(Long senderId, MessageDto messageDto) {
        log.info("MessageService.sendMessage senderId={} groupId={} receiverId={}", senderId, messageDto.getGroupId(), messageDto.getReceiver()!=null?messageDto.getReceiver().getId():null);
        messageDto.setSender(UserDto.builder().id(senderId).build());
        if (messageDto.getGroupId() != null) {
            if (groupUserRepository.findByGroupId(messageDto.getGroupId()).stream()
                    .noneMatch(groupUser -> groupUser.getUserId().equals(senderId))) {
                log.warn("MessageService.sendMessage not a member senderId={} groupId={}", senderId, messageDto.getGroupId());
                throw new RuntimeException("You are not a member of this group");
            }
        } else {
            if (messageDto.getReceiver() == null || messageDto.getReceiver().getId() == null) {
                throw new IllegalArgumentException("Receiver cannot be null for private messages");
            }
            if (blockDao.findByUserIdAndBlockedUserId(messageDto.getReceiver().getId(), senderId).isPresent()) {
                log.info("MessageService.sendMessage blocked senderId={} receiverId={}", senderId, messageDto.getReceiver().getId());
                throw new RuntimeException("You have been blocked by this user");
            }
        }
        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(messageDto.getReceiver() != null ? messageDto.getReceiver().getId() : null)
                .groupId(messageDto.getGroupId())
                .content(messageDto.getContent())
                .timestamp(LocalDateTime.now())
                .status(MessageStatus.Status.DELIVERED)
                .build();
        Message savedMessage = messageRepository.save(message);

        if (savedMessage.getGroupId() != null) {
            groupUserRepository.findByGroupId(savedMessage.getGroupId()).stream()
                    .filter(groupUser -> !groupUser.getUserId().equals(senderId))
                    .forEach(groupUser -> {
                        MessageStatus messageStatus = MessageStatus.builder()
                                .messageId(savedMessage.getId())
                                .userId(groupUser.getUserId())
                                .status(MessageStatus.Status.DELIVERED)
                                .build();
                        messageStatusRepository.save(messageStatus);
                    });
        }

        kafkaProducer.sendMessage(convertToDto(savedMessage));
        log.debug("MessageService.sendMessage persisted messageId={} groupId={} status={}", savedMessage.getId(), savedMessage.getGroupId(), savedMessage.getStatus());
        return convertToDto(savedMessage);
    }

    @Override
    public Page<MessageDto> getChatHistory(Long userId1, Long userId2, Pageable pageable) {
        log.debug("MessageService.getChatHistory u1={} u2={} page={} size={}", userId1, userId2, pageable.getPageNumber(), pageable.getPageSize());
        Page<Message> messages = messageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
                userId1, userId2, userId1, userId2, pageable);
        return messages.map(this::convertToDto);
    }

    @Override
    public Page<MessageDto> getGroupChatHistory(Long groupId, Pageable pageable) {
        log.debug("MessageService.getGroupChatHistory groupId={} page={} size={}", groupId, pageable.getPageNumber(), pageable.getPageSize());
        Page<Message> messages = messageRepository.findByGroupIdOrderByTimestampDesc(groupId, pageable);
        return messages.map(this::convertToDto);
    }

    @Override
    public void markMessageAsRead(Long userId, Long messageId) {
        log.debug("MessageService.markMessageAsRead userId={} messageId={} ", userId, messageId);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getGroupId() != null) {
            // Group message: update MessageStatus
            // Skip if user is the sender (they don't have a MessageStatus entry)
            if (message.getSenderId().equals(userId)) {
                return; // Sender doesn't need to mark their own message as read
            }
            
            // Find MessageStatus entry for this user
            MessageStatus messageStatus = messageStatusRepository.findById(new MessageStatus.MessageStatusId(messageId, userId))
                    .orElse(null);
            
            if (messageStatus != null && messageStatus.getStatus() != MessageStatus.Status.READ) {
                messageStatus.setStatus(MessageStatus.Status.READ);
                messageStatusRepository.save(messageStatus);
                
                // Send read receipt to sender for group messages
                userDao.findById(message.getSenderId()).ifPresent(sender -> {
                    kafkaProducer.sendReadReceipt(ReadReceipt.builder()
                            .messageId(messageId)
                            .sender(sender.getUsername())
                            .receiver(userDao.findById(userId)
                                    .map(user -> user.getUsername())
                                    .orElse("Unknown"))
                            .build());
                    log.trace("MessageService.markMessageAsRead sent group read receipt messageId={} to senderId={}", messageId, sender.getId());
                });
            }
        } else {
            // One-on-one message: update Message status
            if (message.getReceiverId() != null && message.getReceiverId().equals(userId)) {
                if (message.getStatus() != MessageStatus.Status.READ) {
                    message.setStatus(MessageStatus.Status.READ);
                    messageRepository.save(message);
                    
                    // Send read receipt to sender
                    kafkaProducer.sendReadReceipt(ReadReceipt.builder()
                            .messageId(messageId)
                            .sender(userDao.findById(message.getSenderId())
                                    .map(user -> user.getUsername())
                                    .orElse("Unknown"))
                            .receiver(userDao.findById(message.getReceiverId())
                                    .map(user -> user.getUsername())
                                    .orElse("Unknown"))
                            .build());
                    log.trace("MessageService.markMessageAsRead sent private read receipt messageId={} senderId={}", messageId, message.getSenderId());
                }
            }
        }
    }

    @Override
    public MessageInfoDto getMessageInfo(Long messageId) {
        log.debug("MessageService.getMessageInfo messageId={}", messageId);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        List<UserDto> readBy = new java.util.ArrayList<>();
        List<UserDto> deliveredTo = new java.util.ArrayList<>();

        if (message.getGroupId() != null) {
            // Group message: check MessageStatus entries for all group members
            List<MessageStatus> messageStatuses = messageStatusRepository.findByMessageId(messageId);
            
            // Get all group members
            List<com.chatapp.chatservice.model.GroupUser> groupUsers = groupUserRepository.findByGroupId(message.getGroupId());
            
            for (com.chatapp.chatservice.model.GroupUser groupUser : groupUsers) {
                // Skip sender - they always "read" their own message
                if (groupUser.getUserId().equals(message.getSenderId())) {
                    continue;
                }
                
                // Find MessageStatus for this user
                MessageStatus messageStatus = messageStatuses.stream()
                        .filter(ms -> ms.getUserId().equals(groupUser.getUserId()))
                        .findFirst()
                        .orElse(null);
                
                userDao.findById(groupUser.getUserId()).ifPresent(user -> {
                    UserDto userDto = UserDto.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .profilePictureUrl(user.getProfilePictureUrl())
                            .build();
                    
                    if (messageStatus != null) {
                        if (messageStatus.getStatus() == MessageStatus.Status.READ) {
                            readBy.add(userDto);
                        } else if (messageStatus.getStatus() == MessageStatus.Status.DELIVERED) {
                            deliveredTo.add(userDto);
                        }
                    } else {
                        // No MessageStatus entry means message hasn't been delivered yet
                        // This shouldn't happen normally, but handle it gracefully
                    }
                });
            }
        } else {
            // Private message: check Message.status field
            UserDto receiver = userDao.findById(message.getReceiverId())
                    .map(user -> UserDto.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .profilePictureUrl(user.getProfilePictureUrl())
                            .build())
                    .orElse(null);
            
            if (receiver != null) {
                if (message.getStatus() == MessageStatus.Status.READ) {
                    readBy.add(receiver);
                } else if (message.getStatus() == MessageStatus.Status.DELIVERED) {
                    deliveredTo.add(receiver);
                }
            }
        }

        MessageInfoDto dto = MessageInfoDto.builder()
                .readBy(readBy.stream().filter(java.util.Objects::nonNull).collect(Collectors.toList()))
                .deliveredTo(deliveredTo.stream().filter(java.util.Objects::nonNull).collect(Collectors.toList()))
                .build();
        log.trace("MessageService.getMessageInfo result readBy={} deliveredTo={}", dto.getReadBy()!=null?dto.getReadBy().size():0, dto.getDeliveredTo()!=null?dto.getDeliveredTo().size():0);
        return dto;
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

    @Override
    public java.util.List<com.chatapp.chatservice.dto.ConversationDto> getConversations(Long userId) {
        log.debug("MessageService.getConversations userId={}", userId);
        java.util.List<com.chatapp.chatservice.dto.ConversationDto> conversations = new java.util.ArrayList<>();

        // Get private conversations
        contactDao.findByUserId(userId).forEach(contact -> {
            userDao.findById(contact.getContactId()).ifPresent(contactUser -> {
                List<Message> lastPrivateMessageList = messageRepository.findLastPrivateMessage(userId, contactUser.getId(), org.springframework.data.domain.PageRequest.of(0, 1));
                if (!lastPrivateMessageList.isEmpty()) {
                    Message lastMessage = lastPrivateMessageList.get(0);
                    long unreadCount = messageRepository.countUnreadPrivateMessages(contactUser.getId(), userId, MessageStatus.Status.DELIVERED);
                    conversations.add(com.chatapp.chatservice.dto.ConversationDto.builder()
                            .id(contactUser.getId())
                            .name(contactUser.getUsername())
                            .type("PRIVATE")
                            .lastMessage(lastMessage.getContent())
                            .lastMessageTimestamp(lastMessage.getTimestamp())
                            .unreadCount(unreadCount)
                            .profilePictureUrl(contactUser.getProfilePictureUrl())
                            .lastMessageSenderId(lastMessage.getSenderId())
                            .lastMessageStatus(lastMessage.getStatus())
                            .build());
                }
            });
        });

        // Get group conversations
        groupDao.findByUserId(userId).forEach(group -> {
            List<Message> lastGroupMessageList = messageRepository.findLastGroupMessage(group.getId(), org.springframework.data.domain.PageRequest.of(0, 1));
            if (!lastGroupMessageList.isEmpty()) {
                Message lastMessage = lastGroupMessageList.get(0);
                long unreadCount = messageStatusRepository.countByGroupIdAndUserIdAndStatus(group.getId(), userId, MessageStatus.Status.DELIVERED);

                // Aggregate last message status for groups: READ only if all non-sender members read, otherwise DELIVERED
                java.util.List<MessageStatus> msList = messageStatusRepository.findByMessageId(lastMessage.getId());
                java.util.List<com.chatapp.chatservice.model.GroupUser> groupUsers = groupUserRepository.findByGroupId(group.getId());
                long targetCount = groupUsers.stream().filter(gu -> !gu.getUserId().equals(lastMessage.getSenderId())).count();
                long readCount = msList.stream().filter(ms -> ms.getStatus() == MessageStatus.Status.READ).count();
                MessageStatus.Status aggregateStatus = (targetCount > 0 && readCount == targetCount)
                        ? MessageStatus.Status.READ
                        : MessageStatus.Status.DELIVERED;

                conversations.add(com.chatapp.chatservice.dto.ConversationDto.builder()
                        .id(group.getId())
                        .name(group.getName())
                        .type("GROUP")
                        .lastMessage(lastMessage.getContent())
                        .lastMessageTimestamp(lastMessage.getTimestamp())
                        .unreadCount(unreadCount)
                        .lastMessageSenderId(lastMessage.getSenderId())
                        .lastMessageStatus(aggregateStatus)
                        .build());
            } else {
                // Include groups even when there is no message yet
                conversations.add(com.chatapp.chatservice.dto.ConversationDto.builder()
                        .id(group.getId())
                        .name(group.getName())
                        .type("GROUP")
                        .lastMessage(null)
                        .lastMessageTimestamp(null)
                        .unreadCount(0)
                        .lastMessageSenderId(null)
                        .lastMessageStatus(null)
                        .build());
            }
        });

//        conversations.sort((c1, c2) -> c2.getLastMessageTimestamp().compareTo(c1.getLastMessageTimestamp()));
        conversations.sort((c1, c2) -> {
            if (c1.getLastMessageTimestamp() == null && c2.getLastMessageTimestamp() == null) return 0;
            if (c1.getLastMessageTimestamp() == null) return 1;
            if (c2.getLastMessageTimestamp() == null) return -1;
            return c2.getLastMessageTimestamp().compareTo(c1.getLastMessageTimestamp());
        });

        log.trace("MessageService.getConversations count={}", conversations.size());
        return conversations;
    }

}
