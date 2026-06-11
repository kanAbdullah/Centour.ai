package com.centour.llm;

import com.google.genai.Client;
import com.google.genai.types.ContentEmbedding;
import com.google.genai.types.EmbedContentConfig;
import com.google.genai.types.EmbedContentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmbeddingService {

    private final Client client;
    private static final String MODEL = "gemini-embedding-001";
    private static final int DIMENSIONS = 768;

    public EmbeddingService(@Value("${GEMINI_API_KEY}") String apiKey) {
        this.client = new Client.Builder().apiKey(apiKey).build();
    }

    public float[] embedDocument(String text) {
        return embed(text, "RETRIEVAL_DOCUMENT");
    }

    public float[] embedQuery(String text) {
        return embed(text, "RETRIEVAL_QUERY");
    }

    private float[] embed(String text, String taskType) {
        EmbedContentConfig config = EmbedContentConfig.builder()
                .taskType(taskType)
                .outputDimensionality(DIMENSIONS)
                .build();

        try {
            EmbedContentResponse response = client.models.embedContent(MODEL, text, config);

            List<ContentEmbedding> embeddings = response.embeddings()
                    .orElseThrow(() -> new RuntimeException("no embeddings returned"));
            List<Float> values = embeddings.get(0).values()
                    .orElseThrow(() -> new RuntimeException("empty embedding values"));

            float[] result = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                result[i] = values.get(i);
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Gemini embedding error: " + e.getMessage(), e);
        }
    }
}
