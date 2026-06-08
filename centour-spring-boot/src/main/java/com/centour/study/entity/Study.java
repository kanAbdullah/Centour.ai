package com.centour.study.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "studies")
public class Study {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    public Study() {}

    public Study(String title, UUID ownerUserId) {
        this.title = title;
        this.ownerUserId = ownerUserId;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public UUID getOwnerUserId() { return ownerUserId; }
}
