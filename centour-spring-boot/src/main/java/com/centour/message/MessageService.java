package com.centour.message;

import com.centour.llm.LlmService;
import com.centour.message.entity.Message;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MessageService {

    private final MessageRepository repository;
    private final LlmService llmService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MessageService(MessageRepository repository, LlmService llmService) {
        this.repository = repository;
        this.llmService = llmService;
    }

    public List<Message> getMessages(UUID chatId) {
        return repository.findByChatId(chatId);
    }

    public void streamResponse(SseEmitter emitter, UUID chatId, String userContent) {
        try {
            repository.save(new Message(chatId, "user", userContent));
            List<Message> history = repository.findByChatId(chatId);

            StringBuilder fullResponse = new StringBuilder();

            llmService.askStream(history, chunk -> {
                fullResponse.append(chunk);
                try {
                    emitter.send(SseEmitter.event()
                            .data(objectMapper.writeValueAsString(Map.of("chunk", chunk, "done", false))));
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

            repository.save(new Message(chatId, "system", fullResponse.toString()));

            emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(
                    Map.of("chunk", "", "done", true, "full_response", fullResponse.toString()))));
            emitter.complete();

        } catch (Exception e) {
            try {
                emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(
                        Map.of("error", "⚠️ Hata: " + e.getMessage(), "done", true))));
            } catch (Exception ignored) {}
            emitter.completeWithError(e);
        }
    }
}
