package com.orgkgi.service;

import com.orgkgi.entity.Enrollment;
import com.orgkgi.exception.EnrollmentNotFoundException;
import com.orgkgi.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    // Create Enrollment
    public Enrollment addEnrollment(Enrollment enrollment) {
        return enrollmentRepository.save(enrollment);
    }

    // Get All Enrollments
    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    // Get Enrollment By Id
    public Enrollment getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));
    }

    // Update Enrollment
    public Enrollment updateEnrollment(Long id, Enrollment updatedEnrollment) {

        Enrollment existingEnrollment = enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));

        existingEnrollment.setEmployee(updatedEnrollment.getEmployee());
        existingEnrollment.setTraining(updatedEnrollment.getTraining());
        existingEnrollment.setEnrollmentDate(updatedEnrollment.getEnrollmentDate());
        existingEnrollment.setCompletionPercentage(updatedEnrollment.getCompletionPercentage());
        existingEnrollment.setCertificationStatus(updatedEnrollment.isCertificationStatus());

        return enrollmentRepository.save(existingEnrollment);
    }

    // Delete Enrollment
    public void deleteEnrollment(Long id) {

        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));

        enrollmentRepository.delete(enrollment);
    }

    // Track Training Progress
    public Enrollment updateTrainingProgress(Long id, int progress) {

        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));

        enrollment.setCompletionPercentage(progress);

        return enrollmentRepository.save(enrollment);
    }

    // Update Completion Percentage
    public Enrollment updateCompletionPercentage(Long id, int percentage) {

        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));

        enrollment.setCompletionPercentage(percentage);

        return enrollmentRepository.save(enrollment);
    }

    // Track Certification Status
    public Enrollment updateCertificationStatus(Long id, boolean status) {

        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));

        enrollment.setCertificationStatus(status);

        return enrollmentRepository.save(enrollment);
    }

    // Learning Milestone Tracking
    public String trackLearningMilestone(Long id) {

        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() ->
                        new EnrollmentNotFoundException(
                                "Enrollment not found with id: " + id));

        int progress = enrollment.getCompletionPercentage();

        if (progress == 100) {
            return "Training Completed";
        } else if (progress >= 75) {
            return "Advanced";
        } else if (progress >= 50) {
            return "Intermediate";
        } else if (progress >= 25) {
            return "Beginner";
        } else {
            return "Just Started";
        }
    }

    // Calculate Skill Improvement
    public int calculateSkillImprovement(int previousLevel, int currentLevel) {
        return currentLevel - previousLevel;
    }
}