package com.orgkgi.repository;

import com.orgkgi.entity.KnowledgeSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeSessionRepository extends JpaRepository<KnowledgeSession, Long> {
}