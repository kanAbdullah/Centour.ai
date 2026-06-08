package com.centour.db;

import com.centour.db.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DbRepository extends JpaRepository<Conversation, Long> {
    // findAll(), findById(), save(), deleteById() hazır geliyor.
    // Bu satır: method adından SQL üretilir -> "WHERE user_id = ?"
    List<Conversation> findByUserId(Long userId);
}