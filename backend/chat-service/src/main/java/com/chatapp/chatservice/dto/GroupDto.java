package com.chatapp.chatservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDto {

    private Long id;

    private String name;

    private Long createdBy;

    private Set<UserDto> users;

    private String description;

    private String imageUrl;

}
