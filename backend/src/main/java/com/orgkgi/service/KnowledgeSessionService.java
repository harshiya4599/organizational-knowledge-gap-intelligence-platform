package com.orgkgi.service;

import com.orgkgi.entity.KnowledgeSession;
import com.orgkgi.exception.KnowledgeSessionNotFoundException;
import com.orgkgi.repository.KnowledgeSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KnowledgeSessionService {

    private final KnowledgeSessionRepository knowledgeSessionRepository;

    public KnowledgeSessionService(KnowledgeSessionRepository knowledgeSessionRepository) {
        this.knowledgeSessionRepository = knowledgeSessionRepository;
    }

    // Create Knowledge Session
    public KnowledgeSession addKnowledgeSession(KnowledgeSession knowledgeSession) {
        return knowledgeSessionRepository.save(knowledgeSession);
    }

    // Get All Knowledge Sessions
    public List<KnowledgeSession> getAllKnowledgeSessions() {
        return knowledgeSessionRepository.findAll();
    }

    // Get Knowledge Session By Id
    public KnowledgeSession getKnowledgeSessionById(Long id) {

        return knowledgeSessionRepository.findById(id)
                .orElseThrow(() ->
                        new KnowledgeSessionNotFoundException(
                                "Knowledge Session not found with id: " + id));
    }

    // Update Knowledge Session
    public KnowledgeSession updateKnowledgeSession(Long id,
                                                   KnowledgeSession updatedKnowledgeSession) {

        KnowledgeSession existingKnowledgeSession =
                knowledgeSessionRepository.findById(id)
                        .orElseThrow(() ->
                                new KnowledgeSessionNotFoundException(
                                        "Knowledge Session not found with id: " + id));

        existingKnowledgeSession.setTopic(updatedKnowledgeSession.getTopic());
        existingKnowledgeSession.setPresenter(updatedKnowledgeSession.getPresenter());
        existingKnowledgeSession.setSessionDate(updatedKnowledgeSession.getSessionDate());
        existingKnowledgeSession.setLocation(updatedKnowledgeSession.getLocation());

        return knowledgeSessionRepository.save(existingKnowledgeSession);
    }

    // Delete Knowledge Session
    public void deleteKnowledgeSession(Long id) {

        KnowledgeSession knowledgeSession =
                knowledgeSessionRepository.findById(id)
                        .orElseThrow(() ->
                                new KnowledgeSessionNotFoundException(
                                        "Knowledge Session not found with id: " + id));

        knowledgeSessionRepository.delete(knowledgeSession);
    }
}