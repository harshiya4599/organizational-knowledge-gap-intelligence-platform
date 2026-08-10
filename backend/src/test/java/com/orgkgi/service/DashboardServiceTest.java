package com.orgkgi.service;

import com.orgkgi.entity.Assessment;
import com.orgkgi.entity.Employee;
import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.repository.AssessmentRepository;
import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {
    @Mock EmployeeRepository employeeRepository;
    @Mock DepartmentRepository departmentRepository;
    @Mock EmployeeSkillRepository employeeSkillRepository;
    @Mock AssessmentRepository assessmentRepository;
    @InjectMocks DashboardService dashboardService;

    @Test
    void includesLearningProgressFromCompletedAssessments() {
        Employee employee = new Employee();
        employee.setId(1L);
        EmployeeSkill skill = new EmployeeSkill();
        skill.setLevel(4);
        Assessment assessment = new Assessment();
        assessment.setOverallScore(4);

        when(employeeRepository.findAll()).thenReturn(List.of(employee));
        when(departmentRepository.findAll()).thenReturn(List.of());
        when(employeeSkillRepository.findByEmployeeId(1L)).thenReturn(List.of(skill));
        when(assessmentRepository.findAll()).thenReturn(List.of(assessment));

        var dashboard = dashboardService.getDashboardData();
        var progress = (java.util.Map<?, ?>) dashboard.get("learningProgress");
        assertEquals(1, progress.get("assessmentCount"));
        assertEquals(100.0, progress.get("completionRate"));
    }
}
