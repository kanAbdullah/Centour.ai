package com.centour.study;

import com.centour.study.entity.Study;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class StudyController {

    private final StudyService studyService;

    public StudyController(StudyService studyService) {
        this.studyService = studyService;
    }

    @GetMapping("/studies")
    public ResponseEntity<List<Study>> getStudies(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        return ResponseEntity.ok(studyService.listStudies(userId));
    }

    @PostMapping("/studies")
    public ResponseEntity<?> createStudy(@RequestBody Map<String, String> body, Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        Study study = studyService.createStudy(body.get("title"), userId);
        return ResponseEntity.ok(Map.of("study_id", study.getId().toString()));
    }
}
