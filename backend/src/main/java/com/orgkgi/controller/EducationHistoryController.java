package com.orgkgi.controller;

import com.orgkgi.entity.EducationHistory;
import com.orgkgi.service.EducationHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/education-history")
public class EducationHistoryController {

    private final EducationHistoryService educationHistoryService;

    public EducationHistoryController(EducationHistoryService educationHistoryService) {
        this.educationHistoryService = educationHistoryService;
    }

    @PostMapping
    public EducationHistory addEducationHistory(@RequestBody EducationHistory educationHistory) {
        return educationHistoryService.addEducationHistory(educationHistory);
    }

    @GetMapping("/employee/{employeeId}")
    public List<EducationHistory> getEducationHistoryByEmployee(@PathVariable Long employeeId) {
        return educationHistoryService.getEducationHistoryByEmployeeId(employeeId);
    }

    @GetMapping("/{id}")
    public EducationHistory getEducationHistoryById(@PathVariable Long id) {
        return educationHistoryService.getEducationHistoryById(id);
    }

    @PutMapping("/{id}")
    public EducationHistory updateEducationHistory(@PathVariable Long id,
                                                   @RequestBody EducationHistory educationHistory) {
        return educationHistoryService.updateEducationHistory(id, educationHistory);
    }

    @DeleteMapping("/{id}")
    public void deleteEducationHistory(@PathVariable Long id) {
        educationHistoryService.deleteEducationHistory(id);
    }
}
