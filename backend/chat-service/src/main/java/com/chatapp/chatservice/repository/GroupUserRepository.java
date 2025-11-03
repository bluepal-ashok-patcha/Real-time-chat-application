package com.chatapp.chatservice.repository;

import com.chatapp.chatservice.model.GroupUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupUserRepository extends JpaRepository<GroupUser, GroupUser.GroupUserId> {

    List<GroupUser> findByGroupId(Long groupId);

}
