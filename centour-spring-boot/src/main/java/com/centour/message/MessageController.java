package com.centour.message;

import com.centour.message.entity.Message;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
public class MessageController {

    private final MessageService messageService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/messages/{chatId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable UUID chatId) {
        return ResponseEntity.ok(messageService.getMessages(chatId));
    }

    @PostMapping(value = "/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(@RequestBody Map<String, String> body) {
        UUID chatId = UUID.fromString(body.get("chat_id"));
        String content = body.get("content");

        SseEmitter emitter = new SseEmitter(300_000L);
        executor.submit(() -> messageService.streamResponse(emitter, chatId, content));
        return emitter;
    }
}
