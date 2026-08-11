package com.orgkgi.controller;

import com.orgkgi.entity.KnowledgeSession;
import com.orgkgi.service.KnowledgeSessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/knowledge-sessions")
public class KnowledgeSessionController {

    private final KnowledgeSessionService knowledgeSessionService;

    public KnowledgeSessionController(KnowledgeSessionService knowledgeSessionService) {
        this.knowledgeSessionService = knowledgeSessionService;
    }

    @GetMapping
    public List<KnowledgeSession> getAllKnowledgeSessions() {
        return knowledgeSessionService.getAllKnowledgeSessions();
    }

    @GetMapping("/{id}")
    public KnowledgeSession getKnowledgeSessionById(@PathVariable Long id) {
        return knowledgeSessionService.getKnowledgeSessionById(id);
    }

    @PostMapping
    public KnowledgeSession addKnowledgeSession(@Valid @RequestBody KnowledgeSession knowledgeSession) {
        return knowledgeSessionService.addKnowledgeSession(knowledgeSession);
    }

    @PutMapping("/{id}")
    public KnowledgeSession updateKnowledgeSession(@PathVariable Long id,
                                                   @Valid @RequestBody KnowledgeSession knowledgeSession) {
        return knowledgeSessionService.updateKnowledgeSession(id, knowledgeSession);
    }

    @DeleteMapping("/{id}")
    public String deleteKnowledgeSession(@PathVariable Long id) {
        knowledgeSessionService.deleteKnowledgeSession(id);
        return "Knowledge Session deleted successfully";
    }
}