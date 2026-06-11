package com.centour.document;

public record RetrievedChunk(String filename, int chunkIndex, String content, double score) {}
