package com.orgkgi.service;

import com.orgkgi.entity.Department;
import com.orgkgi.entity.Employee;
import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.entity.Assessment;
import com.orgkgi.repository.AssessmentRepository;
import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final AssessmentRepository assessmentRepository;

    public ReportService(EmployeeRepository employeeRepository,
                         DepartmentRepository departmentRepository,
                         EmployeeSkillRepository employeeSkillRepository,
                         AssessmentRepository assessmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.assessmentRepository = assessmentRepository;
    }

    public Map<String, Object> generateEmployeeReport(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        List<EmployeeSkill> skills = employeeSkillRepository.findByEmployeeId(employeeId);
        List<Assessment> assessments = assessmentRepository.findByEmployeeId(employeeId);

        Map<String, Object> report = new HashMap<>();
        report.put("employeeId", employee.getId());
        report.put("employeeName", employee.getName());
        report.put("department", employee.getDepartment().getDepartmentName());
        report.put("skills", skills);
        report.put("assessments", assessments);
        report.put("averageSkillLevel", skills.stream().mapToInt(EmployeeSkill::getLevel).average().orElse(0.0));
        return report;
    }

    public Map<String, Object> generateDepartmentReport(Long departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Map<String, Object> report = new HashMap<>();
        report.put("departmentName", department.getDepartmentName());
        report.put("employeeCount", department.getEmployees().size());
        report.put("employees", department.getEmployees());
        return report;
    }

    public Map<String, Object> generateTrainingEffectivenessReport() {
        List<Employee> employees = employeeRepository.findAll();
        Map<String, Object> report = new HashMap<>();
        report.put("employeeCount", employees.size());
        report.put("averageSkillLevel", employees.stream()
                .flatMap(employee -> employeeSkillRepository.findByEmployeeId(employee.getId()).stream())
                .mapToInt(EmployeeSkill::getLevel)
                .average()
                .orElse(0.0));
        report.put("assessments", assessmentRepository.findAll());
        return report;
    }

    public Map<String, Object> generateWorkforceAnalyticsReport() {
        List<Employee> employees = employeeRepository.findAll();
        Map<String, Object> report = new HashMap<>();
        report.put("employeeCount", employees.size());
        report.put("departmentCount", departmentRepository.count());
        report.put("averageSkillLevel", employees.stream()
                .flatMap(employee -> employeeSkillRepository.findByEmployeeId(employee.getId()).stream())
                .mapToInt(EmployeeSkill::getLevel)
                .average()
                .orElse(0.0));
        report.put("learningProgress", Map.of(
                "assessmentCount", assessmentRepository.count(),
                "averageAssessmentScore", assessmentRepository.findAll().stream()
                        .map(Assessment::getOverallScore)
                        .filter(java.util.Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .average().orElse(0.0)
        ));
        return report;
    }
}
