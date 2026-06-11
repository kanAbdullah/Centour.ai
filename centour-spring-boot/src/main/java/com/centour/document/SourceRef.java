package com.centour.document;

public record SourceRef(String filename, int chunkIndex, String excerpt, double score) {}
