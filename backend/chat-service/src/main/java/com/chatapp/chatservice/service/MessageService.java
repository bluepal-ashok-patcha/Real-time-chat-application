package com.chatapp.chatservice.service;

import com.chatapp.chatservice.dto.MessageDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {

    MessageDto sendMessage(MessageDto messageDto);

    Page<MessageDto> getChatHistory(Long userId1, Long userId2, Pageable pageable);

    Page<MessageDto> getGroupChatHistory(Long groupId, Pageable pageable);

    void markMessageAsRead(Long messageId);

}
