package com.centour.db;

import com.centour.db.entity.Conversation;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/db")   // bu controller'daki tüm rotaların ön eki
public class DbController {

    private final DbService dbService;

    public DbController(DbService dbService) {
        this.dbService = dbService;
    }

    // GET /api/db/conversations?userId=1
    @GetMapping("/conversations")
    public List<Conversation> getConversations(@RequestParam Long userId) {
        return dbService.getByUser(userId);
    }

    // POST /api/db/conversations   (gövde: JSON)
    @PostMapping("/conversations")
    public Conversation create(@RequestBody Conversation body) {
        return dbService.save(body.getUserId(), body.getPrompt(), body.getResponse());
    }
}