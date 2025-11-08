package com.chatapp.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockDto {

	 @NotBlank(message = "id is required")
    private Long id;

    private UserDto user;

    private UserDto blockedUser;

}
