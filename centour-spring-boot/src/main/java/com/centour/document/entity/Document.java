package com.centour.document.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "study_id", nullable = false)
    private UUID studyId;

    @Column(nullable = false)
    private String filename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "content_bytes")
    private byte[] content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Document() {}

    public Document(UUID studyId, String filename, String contentType, long fileSize, byte[] content) {
        this.studyId = studyId;
        this.filename = filename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.content = content;
    }

    public UUID getId() { return id; }
    public UUID getStudyId() { return studyId; }
    public String getFilename() { return filename; }
    public String getContentType() { return contentType; }
    public Long getFileSize() { return fileSize; }
    public Instant getCreatedAt() { return createdAt; }

    @JsonIgnore
    public byte[] getContent() { return content; }
}
