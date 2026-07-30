package com.orgkgi.service;

import com.orgkgi.entity.Experience;
import com.orgkgi.exception.ExperienceNotFoundException;
import com.orgkgi.repository.ExperienceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExperienceService {

    private final ExperienceRepository experienceRepository;

    public ExperienceService(ExperienceRepository experienceRepository) {
        this.experienceRepository = experienceRepository;
    }

    public Experience addExperience(Experience experience) {
        return experienceRepository.save(experience);
    }

    public List<Experience> getExperiencesByEmployeeId(Long employeeId) {
        return experienceRepository.findByEmployeeId(employeeId);
    }

    public Experience getExperienceById(Long id) {
        return experienceRepository.findById(id)
                .orElseThrow(() -> new ExperienceNotFoundException("Experience not found with id: " + id));
    }

    public Experience updateExperience(Long id, Experience updatedExperience) {
        Experience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ExperienceNotFoundException("Experience not found with id: " + id));

        experience.setCompany(updatedExperience.getCompany());
        experience.setRoleTitle(updatedExperience.getRoleTitle());
        experience.setStartDate(updatedExperience.getStartDate());
        experience.setEndDate(updatedExperience.getEndDate());
        experience.setDescription(updatedExperience.getDescription());
        experience.setEmployee(updatedExperience.getEmployee());

        return experienceRepository.save(experience);
    }

    public void deleteExperience(Long id) {
        Experience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ExperienceNotFoundException("Experience not found with id: " + id));

        experienceRepository.delete(experience);
    }
}
