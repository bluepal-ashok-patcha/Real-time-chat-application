package com.chatapp.chatservice.dao;

import com.chatapp.chatservice.model.User;

import java.util.Optional;

public interface UserDao {

    Optional<User> findById(Long id);

}
