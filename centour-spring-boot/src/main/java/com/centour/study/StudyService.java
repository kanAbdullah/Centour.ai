package com.centour.study;

import com.centour.study.entity.Study;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class StudyService {

    private final StudyRepository repository;

    public StudyService(StudyRepository repository) {
        this.repository = repository;
    }

    public List<Study> listStudies(UUID userId) {
        return repository.findByOwnerUserId(userId);
    }

    public Study createStudy(String title, UUID userId) {
        return repository.save(new Study(title, userId));
    }
}
