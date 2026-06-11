package com.centour.document;

import com.centour.document.entity.Document;
import com.centour.document.entity.DocumentChunk;
import com.centour.llm.EmbeddingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class DocumentService {

    private static final int CHUNK_SIZE = 1500;
    private static final int CHUNK_OVERLAP = 150;
    private static final double MIN_SCORE = 0.5;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final TextExtractionService textExtractionService;
    private final EmbeddingService embeddingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DocumentService(DocumentRepository documentRepository,
                            DocumentChunkRepository chunkRepository,
                            TextExtractionService textExtractionService,
                            EmbeddingService embeddingService) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.textExtractionService = textExtractionService;
        this.embeddingService = embeddingService;
    }

    public List<Document> listDocuments(UUID studyId) {
        return documentRepository.findByStudyId(studyId);
    }

    public Document getDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new NoSuchElementException("Document not found"));
    }

    public Document uploadDocument(UUID studyId, MultipartFile file) throws IOException {
        String text = textExtractionService.extractText(file);
        List<String> chunks = chunkText(text);
        if (chunks.isEmpty()) {
            throw new IllegalArgumentException("Could not extract any text from this file");
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        Document document = documentRepository.save(new Document(studyId, filename, contentType, file.getSize(), file.getBytes()));

        for (int i = 0; i < chunks.size(); i++) {
            float[] embedding = embeddingService.embedDocument(chunks.get(i));
            chunkRepository.save(new DocumentChunk(document.getId(), i, chunks.get(i), serializeEmbedding(embedding)));
        }

        return document;
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new NoSuchElementException("Document not found");
        }
        chunkRepository.deleteByDocumentId(documentId);
        documentRepository.deleteById(documentId);
    }

    @Transactional
    public void deleteByStudy(UUID studyId) {
        for (Document document : documentRepository.findByStudyId(studyId)) {
            chunkRepository.deleteByDocumentId(document.getId());
        }
        documentRepository.deleteByStudyId(studyId);
    }

    public List<RetrievedChunk> retrieveContext(UUID studyId, String query, int topK) {
        List<Document> documents = documentRepository.findByStudyId(studyId);
        if (documents.isEmpty()) {
            return List.of();
        }

        Map<UUID, String> filenamesByDocId = new HashMap<>();
        List<UUID> documentIds = new ArrayList<>();
        for (Document document : documents) {
            documentIds.add(document.getId());
            filenamesByDocId.put(document.getId(), document.getFilename());
        }

        List<DocumentChunk> chunks = chunkRepository.findByDocumentIdIn(documentIds);
        if (chunks.isEmpty()) {
            return List.of();
        }

        float[] queryEmbedding = embeddingService.embedQuery(query);

        return chunks.stream()
                .map(chunk -> new RetrievedChunk(
                        filenamesByDocId.get(chunk.getDocumentId()),
                        chunk.getChunkIndex(),
                        chunk.getContent(),
                        cosineSimilarity(queryEmbedding, deserializeEmbedding(chunk.getEmbedding()))))
                .filter(rc -> rc.score() >= MIN_SCORE)
                .sorted(Comparator.comparingDouble(RetrievedChunk::score).reversed())
                .limit(topK)
                .toList();
    }

    private List<String> chunkText(String text) {
        String normalized = text.replace("\r\n", "\n").trim();
        List<String> chunks = new ArrayList<>();
        if (normalized.isEmpty()) return chunks;

        int len = normalized.length();
        int start = 0;
        while (start < len) {
            int end = Math.min(start + CHUNK_SIZE, len);
            if (end < len) {
                int breakPoint = normalized.lastIndexOf("\n\n", end);
                if (breakPoint <= start) breakPoint = normalized.lastIndexOf('\n', end);
                if (breakPoint <= start) breakPoint = normalized.lastIndexOf(". ", end);
                if (breakPoint > start) end = breakPoint + 1;
            }

            String chunk = normalized.substring(start, end).trim();
            if (!chunk.isEmpty()) chunks.add(chunk);

            if (end >= len) break;
            start = Math.max(end - CHUNK_OVERLAP, start + 1);
        }
        return chunks;
    }

    private String serializeEmbedding(float[] embedding) {
        try {
            return objectMapper.writeValueAsString(embedding);
        } catch (IOException e) {
            throw new RuntimeException("Failed to serialize embedding", e);
        }
    }

    private float[] deserializeEmbedding(String json) {
        try {
            return objectMapper.readValue(json, float[].class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to deserialize embedding", e);
        }
    }

    private static double cosineSimilarity(float[] a, float[] b) {
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0 || normB == 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
