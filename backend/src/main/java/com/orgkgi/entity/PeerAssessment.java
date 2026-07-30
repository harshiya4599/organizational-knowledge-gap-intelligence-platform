package com.orgkgi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "peer_assessments")
public class PeerAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "assessor_id", nullable = false)
    private Employee assessor;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private int score;

    private String comments;

    public PeerAssessment() {
    }

    public PeerAssessment(Long id, Employee employee, Employee assessor, Skill skill, int score, String comments) {
        this.id = id;
        this.employee = employee;
        this.assessor = assessor;
        this.skill = skill;
        this.score = score;
        this.comments = comments;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Employee getAssessor() {
        return assessor;
    }

    public void setAssessor(Employee assessor) {
        this.assessor = assessor;
    }

    public Skill getSkill() {
        return skill;
    }

    public void setSkill(Skill skill) {
        this.skill = skill;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}