package com.chatapp.chatservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceipt {

	 @NotBlank(message = "messageid is required")
    private Long messageId;

    private String sender;

    private String receiver;

}
