package com.centour.message;

import com.centour.chat.ChatRepository;
import com.centour.chat.entity.Chat;
import com.centour.document.DocumentService;
import com.centour.document.RetrievedChunk;
import com.centour.document.SourceRef;
import com.centour.llm.LlmService;
import com.centour.message.entity.Message;
import com.centour.topic.TopicRepository;
import com.centour.topic.entity.Topic;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MessageService {

    private static final int TOP_K = 5;
    private static final int EXCERPT_LENGTH = 200;

    private final MessageRepository repository;
    private final LlmService llmService;
    private final ChatRepository chatRepository;
    private final TopicRepository topicRepository;
    private final DocumentService documentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MessageService(MessageRepository repository, LlmService llmService,
                           ChatRepository chatRepository, TopicRepository topicRepository,
                           DocumentService documentService) {
        this.repository = repository;
        this.llmService = llmService;
        this.chatRepository = chatRepository;
        this.topicRepository = topicRepository;
        this.documentService = documentService;
    }

    public List<Message> getMessages(UUID chatId) {
        return repository.findByChatId(chatId);
    }

    public void streamResponse(SseEmitter emitter, UUID chatId, String userContent) {
        try {
            List<Message> history = repository.findByChatId(chatId);

            // If the last message is already this exact user message, it was saved by a
            // previous (failed) attempt — don't save it again, just retry the LLM call.
            boolean alreadySaved = !history.isEmpty()
                    && "user".equals(history.get(history.size() - 1).getAuthor())
                    && history.get(history.size() - 1).getMessage().equals(userContent);

            if (!alreadySaved) {
                Message saved = repository.save(new Message(chatId, "user", userContent));
                history = new ArrayList<>(history);
                history.add(saved);
            }

            List<RetrievedChunk> context = retrieveContext(chatId, userContent);
            List<SourceRef> sources = toSourceRefs(context);

            if (!sources.isEmpty()) {
                emitter.send(SseEmitter.event()
                        .data(objectMapper.writeValueAsString(Map.of("sources", sources, "done", false))));
            }

            StringBuilder fullResponse = new StringBuilder();

            llmService.askStream(history, context, chunk -> {
                fullResponse.append(chunk);
                try {
                    emitter.send(SseEmitter.event()
                            .data(objectMapper.writeValueAsString(Map.of("chunk", chunk, "done", false))));
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

            String sourcesJson = sources.isEmpty() ? null : objectMapper.writeValueAsString(sources);
            repository.save(new Message(chatId, "system", fullResponse.toString(), sourcesJson));

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

    private List<RetrievedChunk> retrieveContext(UUID chatId, String userContent) {
        return chatRepository.findById(chatId)
                .map(Chat::getTopicId)
                .flatMap(topicRepository::findById)
                .map(Topic::getStudyId)
                .map(studyId -> documentService.retrieveContext(studyId, userContent, TOP_K))
                .orElse(List.of());
    }

    private List<SourceRef> toSourceRefs(List<RetrievedChunk> context) {
        return context.stream()
                .map(chunk -> new SourceRef(chunk.filename(), chunk.chunkIndex(), excerpt(chunk.content()), chunk.score()))
                .toList();
    }

    private static String excerpt(String content) {
        String trimmed = content.trim();
        return trimmed.length() <= EXCERPT_LENGTH ? trimmed : trimmed.substring(0, EXCERPT_LENGTH) + "…";
    }
}
