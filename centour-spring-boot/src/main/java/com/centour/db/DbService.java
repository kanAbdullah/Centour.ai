package com.centour.db;

import com.centour.db.entity.Conversation;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DbService {

    private final DbRepository repository;

    // Spring, DbRepository'yi otomatik enjekte eder
    public DbService(DbRepository repository) {
        this.repository = repository;
    }

    public Conversation save(Long userId, String prompt, String response) {
        return repository.save(new Conversation(userId, prompt, response));
    }

    public List<Conversation> getByUser(Long userId) {
        return repository.findByUserId(userId);
    }

    public List<Conversation> getAll() {
        return repository.findAll();
    }
}