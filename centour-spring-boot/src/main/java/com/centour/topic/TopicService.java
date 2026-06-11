package com.centour.topic;

import com.centour.chat.ChatRepository;
import com.centour.chat.ChatService;
import com.centour.chat.entity.Chat;
import com.centour.topic.entity.Topic;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class TopicService {

    private final TopicRepository repository;
    private final ChatRepository chatRepository;
    private final ChatService chatService;

    public TopicService(TopicRepository repository, ChatRepository chatRepository, ChatService chatService) {
        this.repository = repository;
        this.chatRepository = chatRepository;
        this.chatService = chatService;
    }

    public List<Topic> listTopics(UUID studyId) {
        return repository.findByStudyId(studyId);
    }

    public Topic createTopic(String title, UUID studyId) {
        return repository.save(new Topic(title, studyId));
    }

    public Topic renameTopic(UUID topicId, String title) {
        Topic topic = repository.findById(topicId)
                .orElseThrow(() -> new NoSuchElementException("Topic not found"));
        topic.setTitle(title);
        return repository.save(topic);
    }

    public void deleteTopic(UUID topicId) {
        if (!repository.existsById(topicId)) {
            throw new NoSuchElementException("Topic not found");
        }
        for (Chat chat : chatRepository.findByTopicId(topicId)) {
            chatService.deleteChat(chat.getId());
        }
        repository.deleteById(topicId);
    }
}
