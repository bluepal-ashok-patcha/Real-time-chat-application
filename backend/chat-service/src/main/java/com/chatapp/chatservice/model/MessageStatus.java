package com.chatapp.chatservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "message_status")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(MessageStatus.MessageStatusId.class)
public class MessageStatus {

    @Id
    private Long messageId;

    @Id
    private Long userId;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        DELIVERED,
        READ
    }

    public static class MessageStatusId implements Serializable {
        private Long messageId;
        private Long userId;

        public MessageStatusId() {
        }

        public MessageStatusId(Long messageId, Long userId) {
            this.messageId = messageId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            MessageStatusId that = (MessageStatusId) o;
            return Objects.equals(messageId, that.messageId) &&
                    Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(messageId, userId);
        }
    }
}
