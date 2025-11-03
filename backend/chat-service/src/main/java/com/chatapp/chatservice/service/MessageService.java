package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.MessageInfoDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {

    MessageDto sendMessage(Long senderId, MessageDto messageDto);

    Page<MessageDto> getChatHistory(Long userId1, Long userId2, Pageable pageable);

    Page<MessageDto> getGroupChatHistory(Long groupId, Pageable pageable);

    void markMessageAsRead(Long userId, Long messageId);

    MessageInfoDto getMessageInfo(Long messageId);

}
