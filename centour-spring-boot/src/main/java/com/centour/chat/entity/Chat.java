package com.centour.chat.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "chats")
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "topic_id", nullable = false)
    private UUID topicId;

    public Chat() {}

    public Chat(String title, UUID topicId) {
        this.title = title;
        this.topicId = topicId;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public UUID getTopicId() { return topicId; }
    public void setTitle(String title) { this.title = title; }
}
