package com.centour.topic;

import com.centour.topic.entity.Topic;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
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

    @PatchMapping("/topics/{id}")
    public ResponseEntity<?> renameTopic(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        try {
            Topic topic = topicService.renameTopic(id, body.get("title"));
            return ResponseEntity.ok(Map.of("id", topic.getId().toString(), "title", topic.getTitle()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<?> deleteTopic(@PathVariable UUID id) {
        try {
            topicService.deleteTopic(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
