package com.centour.message.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chat_id", nullable = false)
    private UUID chatId;

    @Column(nullable = false)
    private String author;

    @Column(columnDefinition = "TEXT")
    private String message;

    public Message() {}

    public Message(UUID chatId, String author, String message) {
        this.chatId = chatId;
        this.author = author;
        this.message = message;
    }

    public UUID getId() { return id; }
    public UUID getChatId() { return chatId; }
    public String getAuthor() { return author; }
    public String getMessage() { return message; }
}
