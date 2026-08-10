package com.orgkgi.service;

import com.orgkgi.dto.AssessmentRequestDTO;
import com.orgkgi.dto.AssessmentResponseDTO;
import com.orgkgi.entity.*;
import com.orgkgi.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeSkillRepository employeeSkillRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private CompetencyRepository competencyRepository;

    @Mock
    private GapAnalysisRepository gapAnalysisRepository;

    @InjectMocks
    private AssessmentService assessmentService;

    @Test
    void submitAssessmentUpdatesSkillLevelAndPersistsAssessment() {
        Employee employee = new Employee();
        employee.setId(1L);
        Department department = new Department();
        department.setId(10L);
        employee.setDepartment(department);

        Skill skill = new Skill();
        skill.setId(2L);
        skill.setSkillName("Java");

        EmployeeSkill employeeSkill = new EmployeeSkill();
        employeeSkill.setEmployee(employee);
        employeeSkill.setSkill(skill);
        employeeSkill.setLevel(2);

        Competency competency = new Competency();
        competency.setDepartment(department);
        competency.setSkill(skill);
        competency.setRequiredLevel(4);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(skillRepository.findBySkillName("Java")).thenReturn(Optional.of(skill));
        when(employeeSkillRepository.findByEmployeeId(1L)).thenReturn(List.of(employeeSkill));
        when(competencyRepository.findByDepartmentId(10L)).thenReturn(List.of(competency));
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(employeeSkillRepository.save(any(EmployeeSkill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssessmentRequestDTO request = new AssessmentRequestDTO();
        request.setEmployeeId(1L);
        request.setAssessmentType("SELF");
        request.setSkillName("Java");
        request.setScore(4);
        request.setComments("Great progress");

        AssessmentResponseDTO response = assessmentService.submitAssessment(request);

        assertNotNull(response);
        assertEquals(4, response.getOverallScore());
        verify(assessmentRepository).save(any(Assessment.class));
        verify(employeeSkillRepository).save(any(EmployeeSkill.class));
    }
}
