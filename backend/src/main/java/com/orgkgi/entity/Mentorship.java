package com.orgkgi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "mentorships")
public class Mentorship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "mentor_id", nullable = false)
    private Employee mentor;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "mentee_id", nullable = false)
    private Employee mentee;

    private String status;

    public Mentorship() {
    }

    public Mentorship(Long id, Employee mentor, Employee mentee, String status) {
        this.id = id;
        this.mentor = mentor;
        this.mentee = mentee;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Employee getMentor() {
        return mentor;
    }

    public void setMentor(Employee mentor) {
        this.mentor = mentor;
    }

    public Employee getMentee() {
        return mentee;
    }

    public void setMentee(Employee mentee) {
        this.mentee = mentee;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}