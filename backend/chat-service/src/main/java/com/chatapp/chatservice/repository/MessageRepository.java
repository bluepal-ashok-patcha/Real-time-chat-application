package com.chatapp.chatservice.repository;

import com.chatapp.chatservice.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampAsc(
            Long senderId, Long receiverId, Long senderId2, Long receiverId2, Pageable pageable);

    Page<Message> findByGroupIdOrderByTimestampAsc(Long groupId, Pageable pageable);

}
