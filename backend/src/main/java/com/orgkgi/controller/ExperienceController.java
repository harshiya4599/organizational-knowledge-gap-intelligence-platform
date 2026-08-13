package com.orgkgi.controller;

import com.orgkgi.entity.Experience;
import com.orgkgi.service.ExperienceService;
import com.orgkgi.security.EmployeeAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/experiences")
public class ExperienceController {

    private final ExperienceService experienceService;
    private final EmployeeAccessService employeeAccessService;

    public ExperienceController(ExperienceService experienceService, EmployeeAccessService employeeAccessService) {
        this.experienceService = experienceService;
        this.employeeAccessService = employeeAccessService;
    }

    @PostMapping
    public Experience addExperience(@RequestBody Experience experience, Authentication authentication) {
        employeeAccessService.requireAccess(experience.getEmployee().getId(), authentication);
        return experienceService.addExperience(experience);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Experience> getExperiencesByEmployee(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return experienceService.getExperiencesByEmployeeId(employeeId);
    }

    @GetMapping("/{id}")
    public Experience getExperienceById(@PathVariable Long id, Authentication authentication) {
        Experience experience = experienceService.getExperienceById(id);
        employeeAccessService.requireAccess(experience.getEmployee().getId(), authentication);
        return experience;
    }

    @PutMapping("/{id}")
    public Experience updateExperience(@PathVariable Long id,
                                       @RequestBody Experience experience, Authentication authentication) {
        employeeAccessService.requireAccess(experienceService.getExperienceById(id).getEmployee().getId(), authentication);
        employeeAccessService.requireAccess(experience.getEmployee().getId(), authentication);
        return experienceService.updateExperience(id, experience);
    }

    @DeleteMapping("/{id}")
    public void deleteExperience(@PathVariable Long id, Authentication authentication) {
        employeeAccessService.requireAccess(experienceService.getExperienceById(id).getEmployee().getId(), authentication);
        experienceService.deleteExperience(id);
    }
}
