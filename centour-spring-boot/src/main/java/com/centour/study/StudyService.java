package com.centour.study;

import com.centour.document.DocumentService;
import com.centour.study.entity.Study;
import com.centour.topic.TopicRepository;
import com.centour.topic.TopicService;
import com.centour.topic.entity.Topic;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class StudyService {

    private final StudyRepository repository;
    private final TopicRepository topicRepository;
    private final TopicService topicService;
    private final DocumentService documentService;

    public StudyService(StudyRepository repository, TopicRepository topicRepository, TopicService topicService, DocumentService documentService) {
        this.repository = repository;
        this.topicRepository = topicRepository;
        this.topicService = topicService;
        this.documentService = documentService;
    }

    public List<Study> listStudies(UUID userId) {
        return repository.findByOwnerUserId(userId);
    }

    public Study createStudy(String title, UUID userId) {
        return repository.save(new Study(title, userId));
    }

    public Study renameStudy(UUID studyId, UUID userId, String title) {
        Study study = findOwned(studyId, userId);
        study.setTitle(title);
        return repository.save(study);
    }

    public void deleteStudy(UUID studyId, UUID userId) {
        Study study = findOwned(studyId, userId);
        for (Topic topic : topicRepository.findByStudyId(study.getId())) {
            topicService.deleteTopic(topic.getId());
        }
        documentService.deleteByStudy(study.getId());
        repository.deleteById(study.getId());
    }

    private Study findOwned(UUID studyId, UUID userId) {
        Study study = repository.findById(studyId)
                .orElseThrow(() -> new NoSuchElementException("Study not found"));
        if (!study.getOwnerUserId().equals(userId)) {
            throw new SecurityException("Not allowed to access this study");
        }
        return study;
    }
}
