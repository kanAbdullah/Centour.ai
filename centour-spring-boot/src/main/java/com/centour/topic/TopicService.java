package com.centour.topic;

import com.centour.topic.entity.Topic;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TopicService {

    private final TopicRepository repository;

    public TopicService(TopicRepository repository) {
        this.repository = repository;
    }

    public List<Topic> listTopics(UUID studyId) {
        return repository.findByStudyId(studyId);
    }

    public Topic createTopic(String title, UUID studyId) {
        return repository.save(new Topic(title, studyId));
    }
}
