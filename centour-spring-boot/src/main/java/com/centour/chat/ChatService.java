package com.centour.chat;

import com.centour.chat.entity.Chat;
import com.centour.message.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository repository;
    private final MessageRepository messageRepository;

    public ChatService(ChatRepository repository, MessageRepository messageRepository) {
        this.repository = repository;
        this.messageRepository = messageRepository;
    }

    public List<Chat> listChats(UUID topicId) {
        return repository.findByTopicId(topicId);
    }

    public Chat createChat(String title, UUID topicId) {
        String chatTitle = (title == null || title.isBlank()) ? "New Chat" : title;
        return repository.save(new Chat(chatTitle, topicId));
    }

    public Chat renameChat(UUID chatId, String title) {
        Chat chat = repository.findById(chatId)
                .orElseThrow(() -> new NoSuchElementException("Chat not found"));
        chat.setTitle(title);
        return repository.save(chat);
    }

    @Transactional
    public void deleteChat(UUID chatId) {
        if (!repository.existsById(chatId)) {
            throw new NoSuchElementException("Chat not found");
        }
        messageRepository.deleteByChatId(chatId);
        repository.deleteById(chatId);
    }
}
