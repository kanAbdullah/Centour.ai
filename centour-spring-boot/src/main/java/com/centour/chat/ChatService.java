package com.centour.chat;

import com.centour.chat.entity.Chat;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository repository;

    public ChatService(ChatRepository repository) {
        this.repository = repository;
    }

    public List<Chat> listChats(UUID topicId) {
        return repository.findByTopicId(topicId);
    }

    public Chat createChat(String title, UUID topicId) {
        return repository.save(new Chat(title, topicId));
    }
}
