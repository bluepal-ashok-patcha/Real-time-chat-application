package com.chatapp.chatservice.kafka;

import com.chatapp.chatservice.dto.MessageDto;
import com.chatapp.chatservice.dto.ReadReceipt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaProducer {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducer.class);
    private static final String MESSAGES_TOPIC = "messages";
    private static final String READ_RECEIPTS_TOPIC = "read-receipts";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(MessageDto messageDto) {
        logger.info(String.format("#### -> Producing message -> %s", messageDto));
        this.kafkaTemplate.send(MESSAGES_TOPIC, messageDto);
    }

    public void sendReadReceipt(ReadReceipt readReceipt) {
        logger.info(String.format("#### -> Producing read receipt -> %s", readReceipt));
        this.kafkaTemplate.send(READ_RECEIPTS_TOPIC, readReceipt);
    }
}
