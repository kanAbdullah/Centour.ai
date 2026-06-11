package com.centour.topic.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "study_id", nullable = false)
    private UUID studyId;

    public Topic() {}

    public Topic(String title, UUID studyId) {
        this.title = title;
        this.studyId = studyId;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public UUID getStudyId() { return studyId; }
    public void setTitle(String title) { this.title = title; }
}
