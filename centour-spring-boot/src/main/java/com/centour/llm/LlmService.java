package com.centour.llm;

import com.centour.message.entity.Message;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
public class LlmService {

    private final Client client;
    private static final String MODEL = "gemini-2.5-flash-lite";

    public LlmService(@Value("${GEMINI_API_KEY}") String apiKey) {
        this.client = new Client.Builder().apiKey(apiKey).build();
    }

    public void askStream(List<Message> messages, Consumer<String> onChunk) {
        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException("Empty messages list");
        }
        String formatted = messages.stream()
                .map(m -> m.getAuthor() + ": " + m.getMessage())
                .collect(Collectors.joining("\n"));

        try (ResponseStream<GenerateContentResponse> stream =
                     client.models.generateContentStream(MODEL, formatted, null)) {
            for (GenerateContentResponse chunk : stream) {
                String text = chunk.text();
                if (text != null && !text.isEmpty()) {
                    onChunk.accept(text);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Gemini streaming error: " + e.getMessage(), e);
        }
    }
}
