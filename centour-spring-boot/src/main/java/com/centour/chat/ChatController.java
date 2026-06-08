package com.centour.chat;

import com.centour.chat.entity.Chat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/chats/{topicId}")
    public ResponseEntity<List<Chat>> getChats(@PathVariable UUID topicId) {
        return ResponseEntity.ok(chatService.listChats(topicId));
    }

    @PostMapping("/chats")
    public ResponseEntity<?> createChat(@RequestBody Map<String, String> body) {
        UUID topicId = UUID.fromString(body.get("topic_id"));
        Chat chat = chatService.createChat(body.get("title"), topicId);
        return ResponseEntity.ok(Map.of("chat_id", chat.getId().toString()));
    }
}
