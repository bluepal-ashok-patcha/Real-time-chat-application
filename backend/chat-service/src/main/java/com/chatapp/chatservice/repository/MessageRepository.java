package com.chatapp.chatservice.repository;

import com.chatapp.chatservice.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chatapp.chatservice.model.MessageStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampAsc(
            Long senderId, Long receiverId, Long senderId2, Long receiverId2, Pageable pageable);

    Page<Message> findByGroupIdOrderByTimestampAsc(Long groupId, Pageable pageable);

    Page<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
            Long senderId, Long receiverId, Long senderId2, Long receiverId2, Pageable pageable);

    Page<Message> findByGroupIdOrderByTimestampDesc(Long groupId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE (m.senderId = :userId1 AND m.receiverId = :userId2) OR (m.senderId = :userId2 AND m.receiverId = :userId1) ORDER BY m.timestamp DESC")
    List<Message> findLastPrivateMessage(@Param("userId1") Long userId1, @Param("userId2") Long userId2, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.groupId = :groupId ORDER BY m.timestamp DESC")
    List<Message> findLastGroupMessage(@Param("groupId") Long groupId, Pageable pageable);

    // Count only messages sent by :senderId to :receiverId with given status (don't count current user's own messages)
    @Query("SELECT COUNT(m) FROM Message m WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.status = :status")
    long countUnreadPrivateMessages(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId, @Param("status") MessageStatus.Status status);

    // Search messages by content for a specific user (across all their conversations)
    @Query("SELECT m FROM Message m WHERE " +
           "((((m.senderId = :userId OR m.receiverId = :userId) AND m.groupId IS NULL) OR " +
           "(m.groupId IN (SELECT gu.groupId FROM GroupUser gu WHERE gu.userId = :userId))) " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY m.timestamp DESC")
    Page<Message> searchMessages(@Param("userId") Long userId, @Param("query") String query, Pageable pageable);
}
