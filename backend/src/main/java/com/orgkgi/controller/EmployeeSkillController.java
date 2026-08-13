package com.orgkgi.controller;

import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.service.EmployeeSkillService;
import com.orgkgi.security.EmployeeAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee-skills")
public class EmployeeSkillController {

    private final EmployeeSkillService employeeSkillService;
    private final EmployeeAccessService employeeAccessService;

    public EmployeeSkillController(EmployeeSkillService employeeSkillService, EmployeeAccessService employeeAccessService) {
        this.employeeSkillService = employeeSkillService;
        this.employeeAccessService = employeeAccessService;
    }

    // Create Employee Skill
    @PostMapping
    public EmployeeSkill addEmployeeSkill(@RequestBody EmployeeSkill employeeSkill, Authentication authentication) {
        employeeAccessService.requireAccess(employeeSkill.getEmployee().getId(), authentication);
        return employeeSkillService.addEmployeeSkill(employeeSkill);
    }

    // Get All Employee Skills
    @GetMapping
    public List<EmployeeSkill> getAllEmployeeSkills(@RequestParam(required = false) Long employeeId, Authentication authentication) {
        if (employeeId == null) employeeId = employeeAccessService.getEmployeeId(authentication);
        employeeAccessService.requireAccess(employeeId, authentication);
        return employeeSkillService.getEmployeeSkillsByEmployeeId(employeeId);
    }

    // Get Employee Skill By ID
    @GetMapping("/{id}")
    public EmployeeSkill getEmployeeSkillById(@PathVariable Long id, Authentication authentication) {
        EmployeeSkill skill = employeeSkillService.getEmployeeSkillById(id);
        employeeAccessService.requireAccess(skill.getEmployee().getId(), authentication);
        return skill;
    }

    // Update Employee Skill
    @PutMapping("/{id}")
    public EmployeeSkill updateEmployeeSkill(@PathVariable Long id,
                                             @RequestBody EmployeeSkill employeeSkill, Authentication authentication) {
        EmployeeSkill existing = employeeSkillService.getEmployeeSkillById(id);
        employeeAccessService.requireAccess(existing.getEmployee().getId(), authentication);
        employeeAccessService.requireAccess(employeeSkill.getEmployee().getId(), authentication);
        return employeeSkillService.updateEmployeeSkill(id, employeeSkill);
    }

    // Delete Employee Skill
    @DeleteMapping("/{id}")
    public void deleteEmployeeSkill(@PathVariable Long id, Authentication authentication) {
        employeeAccessService.requireAccess(employeeSkillService.getEmployeeSkillById(id).getEmployee().getId(), authentication);
        employeeSkillService.deleteEmployeeSkill(id);
    }
}
