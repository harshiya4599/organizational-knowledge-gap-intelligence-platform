package com.orgkgi.controller;

import com.orgkgi.entity.EducationHistory;
import com.orgkgi.service.EducationHistoryService;
import com.orgkgi.security.EmployeeAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/education-history")
public class EducationHistoryController {

    private final EducationHistoryService educationHistoryService;
    private final EmployeeAccessService employeeAccessService;

    public EducationHistoryController(EducationHistoryService educationHistoryService, EmployeeAccessService employeeAccessService) {
        this.educationHistoryService = educationHistoryService;
        this.employeeAccessService = employeeAccessService;
    }

    @PostMapping
    public EducationHistory addEducationHistory(@RequestBody EducationHistory educationHistory, Authentication authentication) {
        employeeAccessService.requireAccess(educationHistory.getEmployee().getId(), authentication);
        return educationHistoryService.addEducationHistory(educationHistory);
    }

    @GetMapping("/employee/{employeeId}")
    public List<EducationHistory> getEducationHistoryByEmployee(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return educationHistoryService.getEducationHistoryByEmployeeId(employeeId);
    }

    @GetMapping("/{id}")
    public EducationHistory getEducationHistoryById(@PathVariable Long id, Authentication authentication) {
        EducationHistory history = educationHistoryService.getEducationHistoryById(id);
        employeeAccessService.requireAccess(history.getEmployee().getId(), authentication);
        return history;
    }

    @PutMapping("/{id}")
    public EducationHistory updateEducationHistory(@PathVariable Long id,
                                                   @RequestBody EducationHistory educationHistory, Authentication authentication) {
        employeeAccessService.requireAccess(educationHistoryService.getEducationHistoryById(id).getEmployee().getId(), authentication);
        employeeAccessService.requireAccess(educationHistory.getEmployee().getId(), authentication);
        return educationHistoryService.updateEducationHistory(id, educationHistory);
    }

    @DeleteMapping("/{id}")
    public void deleteEducationHistory(@PathVariable Long id, Authentication authentication) {
        employeeAccessService.requireAccess(educationHistoryService.getEducationHistoryById(id).getEmployee().getId(), authentication);
        educationHistoryService.deleteEducationHistory(id);
    }
}
