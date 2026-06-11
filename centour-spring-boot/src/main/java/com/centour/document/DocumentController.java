package com.centour.document;

import com.centour.document.entity.Document;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/studies/{studyId}/documents")
    public ResponseEntity<List<Document>> getDocuments(@PathVariable UUID studyId) {
        return ResponseEntity.ok(documentService.listDocuments(studyId));
    }

    @PostMapping("/studies/{studyId}/documents")
    public ResponseEntity<?> uploadDocument(@PathVariable UUID studyId, @RequestParam("file") MultipartFile file) {
        try {
            Document document = documentService.uploadDocument(studyId, file);
            return ResponseEntity.ok(document);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to process file"));
        }
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID id) {
        try {
            Document document = documentService.getDocument(id);
            if (document.getContent() == null) {
                return ResponseEntity.notFound().build();
            }

            String filename = document.getFilename().replace("\"", "");
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(document.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(document.getContent());
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID id) {
        try {
            documentService.deleteDocument(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
