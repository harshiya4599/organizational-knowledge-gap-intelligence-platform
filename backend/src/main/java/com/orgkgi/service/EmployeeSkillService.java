package com.orgkgi.service;

import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.exception.EmployeeSkillNotFoundException;
import com.orgkgi.exception.InvalidSkillLevelException;
import com.orgkgi.repository.EmployeeSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeSkillService {

    private final EmployeeSkillRepository employeeSkillRepository;

    public EmployeeSkillService(EmployeeSkillRepository employeeSkillRepository) {
        this.employeeSkillRepository = employeeSkillRepository;
    }

    // Create Employee Skill
    public EmployeeSkill addEmployeeSkill(EmployeeSkill employeeSkill) {

        if (employeeSkill.getLevel() < 1 || employeeSkill.getLevel() > 5) {
            throw new InvalidSkillLevelException("Skill level must be between 1 and 5");
        }

        return employeeSkillRepository.save(employeeSkill);
    }

    // Get All Employee Skills
    public List<EmployeeSkill> getAllEmployeeSkills() {
        return employeeSkillRepository.findAll();
    }

    public List<EmployeeSkill> getEmployeeSkillsByEmployeeId(Long employeeId) {
        return employeeSkillRepository.findByEmployeeId(employeeId);
    }

    // Get Employee Skill By Id
    public EmployeeSkill getEmployeeSkillById(Long id) {
        return employeeSkillRepository.findById(id)
                .orElseThrow(() ->
                        new EmployeeSkillNotFoundException("Employee Skill not found with id: " + id));
    }

    // Update Employee Skill
    public EmployeeSkill updateEmployeeSkill(Long id, EmployeeSkill updatedEmployeeSkill) {

        EmployeeSkill existingEmployeeSkill = employeeSkillRepository.findById(id)
                .orElseThrow(() ->
                        new EmployeeSkillNotFoundException("Employee Skill not found with id: " + id));

        if (updatedEmployeeSkill.getLevel() < 1 || updatedEmployeeSkill.getLevel() > 5) {
            throw new InvalidSkillLevelException("Skill level must be between 1 and 5");
        }

        existingEmployeeSkill.setEmployee(updatedEmployeeSkill.getEmployee());
        existingEmployeeSkill.setSkill(updatedEmployeeSkill.getSkill());
        existingEmployeeSkill.setLevel(updatedEmployeeSkill.getLevel());

        return employeeSkillRepository.save(existingEmployeeSkill);
    }

    // Delete Employee Skill
    public void deleteEmployeeSkill(Long id) {

        EmployeeSkill employeeSkill = employeeSkillRepository.findById(id)
                .orElseThrow(() ->
                        new EmployeeSkillNotFoundException("Employee Skill not found with id: " + id));

        employeeSkillRepository.delete(employeeSkill);
    }
}
