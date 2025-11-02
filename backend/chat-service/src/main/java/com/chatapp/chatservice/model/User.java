package com.chatapp.chatservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    // We don't need password and role here for chat service context
    // but they exist in the shared 'users' table.
    // Mapping them is optional but can prevent issues with JPA if the schema is managed automatically.
    // For now, we'll keep it simple and only map what's needed.
}
