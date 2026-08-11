package com.orgkgi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "enrollments")
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @Column(nullable = false)
    private LocalDate enrollmentDate = LocalDate.now();

    @Min(0)
    @Max(100)
    private int completionPercentage;

    private boolean certificationStatus;

    public Enrollment() {
    }

    public Enrollment(Long id,
                      Employee employee,
                      Training training,
                      LocalDate enrollmentDate,
                      int completionPercentage,
                      boolean certificationStatus) {
        this.id = id;
        this.employee = employee;
        this.training = training;
        this.enrollmentDate = enrollmentDate;
        this.completionPercentage = completionPercentage;
        this.certificationStatus = certificationStatus;
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

    public Training getTraining() {
        return training;
    }

    public void setTraining(Training training) {
        this.training = training;
    }

    public LocalDate getEnrollmentDate() {
        return enrollmentDate;
    }

    public void setEnrollmentDate(LocalDate enrollmentDate) {
        this.enrollmentDate = enrollmentDate;
    }

    public int getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(int completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public boolean isCertificationStatus() {
        return certificationStatus;
    }

    public void setCertificationStatus(boolean certificationStatus) {
        this.certificationStatus = certificationStatus;
    }

    // Optional getter for compatibility
    public boolean getCertificationStatus() {
        return certificationStatus;
    }
}