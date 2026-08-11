package com.orgkgi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "knowledge_sessions")
public class KnowledgeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String topic;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee presenter;

    @Future
    private LocalDate sessionDate;

    private String location;

    public KnowledgeSession() {
    }

    public KnowledgeSession(Long id,
                            String topic,
                            Employee presenter,
                            LocalDate sessionDate,
                            String location) {
        this.id = id;
        this.topic = topic;
        this.presenter = presenter;
        this.sessionDate = sessionDate;
        this.location = location;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public Employee getPresenter() {
        return presenter;
    }

    public void setPresenter(Employee presenter) {
        this.presenter = presenter;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}