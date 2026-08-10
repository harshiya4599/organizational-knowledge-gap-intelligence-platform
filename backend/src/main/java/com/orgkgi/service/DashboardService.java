package com.orgkgi.service;

import com.orgkgi.entity.Department;
import com.orgkgi.entity.Employee;
import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import com.orgkgi.repository.AssessmentRepository;
import com.orgkgi.entity.Assessment;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final AssessmentRepository assessmentRepository;

    public DashboardService(EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository,
                            EmployeeSkillRepository employeeSkillRepository,
                            AssessmentRepository assessmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.assessmentRepository = assessmentRepository;
    }

    public Map<String, Object> getDashboardData() {
        List<Employee> employees = employeeRepository.findAll();
        List<Department> departments = departmentRepository.findAll();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("employeeCount", employees.size());
        dashboard.put("departmentCount", departments.size());

        double averageSkillLevel = employees.stream()
                .flatMap(employee -> employeeSkillRepository.findByEmployeeId(employee.getId()).stream())
                .mapToInt(EmployeeSkill::getLevel)
                .average()
                .orElse(0.0);

        dashboard.put("averageSkillLevel", Math.round(averageSkillLevel * 100.0) / 100.0);
        dashboard.put("teamSkillCoverage", calculateTeamSkillCoverage(employees));
        dashboard.put("trainingCompletionRate", calculateTrainingCompletionRate(employees));
        dashboard.put("learningProgress", calculateLearningProgress());
        dashboard.put("departmentPerformance", calculateDepartmentPerformance(departments));
        return dashboard;
    }

    private Map<String, Object> calculateLearningProgress() {
        List<Assessment> assessments = assessmentRepository.findAll();
        double averageScore = assessments.stream()
                .map(Assessment::getOverallScore)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        long completedAssessments = assessments.stream()
                .filter(assessment -> assessment.getOverallScore() != null && assessment.getOverallScore() >= 3)
                .count();

        Map<String, Object> progress = new HashMap<>();
        progress.put("assessmentCount", assessments.size());
        progress.put("averageAssessmentScore", Math.round(averageScore * 100.0) / 100.0);
        progress.put("completionRate", assessments.isEmpty() ? 0.0
                : Math.round(completedAssessments * 10000.0 / assessments.size()) / 100.0);
        return progress;
    }

    private double calculateTeamSkillCoverage(List<Employee> employees) {
        if (employees.isEmpty()) {
            return 0.0;
        }
        int totalSkills = 0;
        int coveredSkills = 0;
        for (Employee employee : employees) {
            List<EmployeeSkill> skills = employeeSkillRepository.findByEmployeeId(employee.getId());
            totalSkills += skills.size();
            coveredSkills += (int) skills.stream().filter(skill -> skill.getLevel() >= 3).count();
        }
        return totalSkills == 0 ? 0.0 : Math.round((coveredSkills * 100.0 / totalSkills) * 100.0) / 100.0;
    }

    private double calculateTrainingCompletionRate(List<Employee> employees) {
        if (employees.isEmpty()) {
            return 0.0;
        }
        int completed = 0;
        for (Employee employee : employees) {
            List<EmployeeSkill> skills = employeeSkillRepository.findByEmployeeId(employee.getId());
            if (!skills.isEmpty() && skills.stream().mapToInt(EmployeeSkill::getLevel).average().orElse(0.0) >= 3) {
                completed++;
            }
        }
        return Math.round((completed * 100.0 / employees.size()) * 100.0) / 100.0;
    }

    private List<Map<String, Object>> calculateDepartmentPerformance(List<Department> departments) {
        return departments.stream().map(department -> {
            Map<String, Object> item = new HashMap<>();
            item.put("departmentId", department.getId());
            item.put("departmentName", department.getDepartmentName());
            item.put("employeeCount", department.getEmployees().size());
            item.put("averageSkillLevel", department.getEmployees().stream()
                    .flatMap(employee -> employeeSkillRepository.findByEmployeeId(employee.getId()).stream())
                    .mapToInt(EmployeeSkill::getLevel)
                    .average()
                    .orElse(0.0));
            return item;
        }).toList();
    }
}
