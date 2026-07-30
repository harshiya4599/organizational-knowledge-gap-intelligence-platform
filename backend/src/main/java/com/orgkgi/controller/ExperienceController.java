package com.orgkgi.controller;

import com.orgkgi.entity.Experience;
import com.orgkgi.service.ExperienceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/experiences")
public class ExperienceController {

    private final ExperienceService experienceService;

    public ExperienceController(ExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @PostMapping
    public Experience addExperience(@RequestBody Experience experience) {
        return experienceService.addExperience(experience);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Experience> getExperiencesByEmployee(@PathVariable Long employeeId) {
        return experienceService.getExperiencesByEmployeeId(employeeId);
    }

    @GetMapping("/{id}")
    public Experience getExperienceById(@PathVariable Long id) {
        return experienceService.getExperienceById(id);
    }

    @PutMapping("/{id}")
    public Experience updateExperience(@PathVariable Long id,
                                       @RequestBody Experience experience) {
        return experienceService.updateExperience(id, experience);
    }

    @DeleteMapping("/{id}")
    public void deleteExperience(@PathVariable Long id) {
        experienceService.deleteExperience(id);
    }
}
