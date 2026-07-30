package com.orgkgi.service;

import com.orgkgi.entity.EducationHistory;
import com.orgkgi.exception.EducationHistoryNotFoundException;
import com.orgkgi.repository.EducationHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EducationHistoryService {

    private final EducationHistoryRepository educationHistoryRepository;

    public EducationHistoryService(EducationHistoryRepository educationHistoryRepository) {
        this.educationHistoryRepository = educationHistoryRepository;
    }

    public EducationHistory addEducationHistory(EducationHistory educationHistory) {
        return educationHistoryRepository.save(educationHistory);
    }

    public List<EducationHistory> getEducationHistoryByEmployeeId(Long employeeId) {
        return educationHistoryRepository.findByEmployeeId(employeeId);
    }

    public EducationHistory getEducationHistoryById(Long id) {
        return educationHistoryRepository.findById(id)
                .orElseThrow(() -> new EducationHistoryNotFoundException("Education history not found with id: " + id));
    }

    public EducationHistory updateEducationHistory(Long id, EducationHistory updatedEducationHistory) {
        EducationHistory educationHistory = educationHistoryRepository.findById(id)
                .orElseThrow(() -> new EducationHistoryNotFoundException("Education history not found with id: " + id));

        educationHistory.setInstitution(updatedEducationHistory.getInstitution());
        educationHistory.setQualification(updatedEducationHistory.getQualification());
        educationHistory.setFieldOfStudy(updatedEducationHistory.getFieldOfStudy());
        educationHistory.setStartDate(updatedEducationHistory.getStartDate());
        educationHistory.setEndDate(updatedEducationHistory.getEndDate());
        educationHistory.setEmployee(updatedEducationHistory.getEmployee());

        return educationHistoryRepository.save(educationHistory);
    }

    public void deleteEducationHistory(Long id) {
        EducationHistory educationHistory = educationHistoryRepository.findById(id)
                .orElseThrow(() -> new EducationHistoryNotFoundException("Education history not found with id: " + id));

        educationHistoryRepository.delete(educationHistory);
    }
}
