package com.chatapp.chatservice.model;

import jakarta.persistence.Entity;
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
@Table(name = "group_users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(GroupUser.GroupUserId.class)
public class GroupUser {

    @Id
    private Long groupId;

    @Id
    private Long userId;

    public static class GroupUserId implements Serializable {
        private Long groupId;
        private Long userId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            GroupUserId that = (GroupUserId) o;
            return Objects.equals(groupId, that.groupId) &&
                    Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(groupId, userId);
        }
    }
}
