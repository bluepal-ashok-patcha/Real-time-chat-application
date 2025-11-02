package com.chatapp.chatservice.kafka;

import com.chatapp.chatservice.dto.MessageDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaProducer {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducer.class);
    private static final String TOPIC = "messages";

    private final KafkaTemplate<String, MessageDto> kafkaTemplate;

    public KafkaProducer(KafkaTemplate<String, MessageDto> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(MessageDto messageDto) {
        logger.info(String.format("#### -> Producing message -> %s", messageDto));
        this.kafkaTemplate.send(TOPIC, messageDto);
    }
}
