package com.centour.topic;

import com.centour.topic.entity.Topic;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/topics/{studyId}")
    public ResponseEntity<List<Topic>> getTopics(@PathVariable UUID studyId) {
        return ResponseEntity.ok(topicService.listTopics(studyId));
    }

    @PostMapping("/topics")
    public ResponseEntity<?> createTopic(@RequestBody Map<String, String> body) {
        UUID studyId = UUID.fromString(body.get("study_id"));
        Topic topic = topicService.createTopic(body.get("title"), studyId);
        return ResponseEntity.ok(Map.of("topic_id", topic.getId().toString()));
    }
}
