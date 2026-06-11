package com.centour.document;

import com.centour.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByStudyId(UUID studyId);
    void deleteByStudyId(UUID studyId);
}
