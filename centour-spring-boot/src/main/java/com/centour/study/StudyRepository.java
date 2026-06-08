package com.centour.study;

import com.centour.study.entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudyRepository extends JpaRepository<Study, UUID> {
    List<Study> findByOwnerUserId(UUID ownerUserId);
}
