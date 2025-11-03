package com.chatapp.chatservice.repository;

import com.chatapp.chatservice.model.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatus, MessageStatus.MessageStatusId> {

    List<MessageStatus> findByMessageId(Long messageId);

}
