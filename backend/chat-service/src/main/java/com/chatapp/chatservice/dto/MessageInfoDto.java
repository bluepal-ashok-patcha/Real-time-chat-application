package com.chatapp.chatservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageInfoDto {

    private List<UserDto> readBy;
    private List<UserDto> deliveredTo;

}
