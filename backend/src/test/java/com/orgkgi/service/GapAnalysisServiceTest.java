package com.orgkgi.service;

import com.orgkgi.entity.Department;
import com.orgkgi.entity.Employee;
import com.orgkgi.repository.CompetencyRepository;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import com.orgkgi.repository.GapAnalysisRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GapAnalysisServiceTest {
    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeSkillRepository employeeSkillRepository;
    @Mock private CompetencyRepository competencyRepository;
    @Mock private GapAnalysisRepository gapAnalysisRepository;
    @InjectMocks private GapAnalysisService gapAnalysisService;

    @Test
    void generationRemovesPreviousResultsBeforeSavingNewOnes() {
        Department department = new Department();
        department.setId(3L);
        Employee employee = new Employee();
        employee.setId(12L);
        employee.setDepartment(department);
        when(employeeRepository.findById(12L)).thenReturn(Optional.of(employee));
        when(employeeSkillRepository.findByEmployeeId(12L)).thenReturn(List.of());
        when(competencyRepository.findByDepartmentId(3L)).thenReturn(List.of());

        assertTrue(gapAnalysisService.generateGapAnalysis(12L).isEmpty());
        verify(gapAnalysisRepository).deleteByEmployeeId(12L);
    }
}
