package com.chatapp.chatservice.repository;

import com.chatapp.chatservice.model.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatus, MessageStatus.MessageStatusId> {

    List<MessageStatus> findByMessageId(Long messageId);

    @Query("SELECT COUNT(ms) FROM MessageStatus ms JOIN Message m ON ms.messageId = m.id WHERE m.groupId = :groupId AND ms.userId = :userId AND ms.status = :status")
    long countByGroupIdAndUserIdAndStatus(@Param("groupId") Long groupId, @Param("userId") Long userId, @Param("status") MessageStatus.Status status);

}
