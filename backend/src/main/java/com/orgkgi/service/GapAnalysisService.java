
package com.orgkgi.service;
 
import com.orgkgi.entity.*;
import com.orgkgi.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.util.ArrayList;
import java.util.List;
 
@Service
public class GapAnalysisService {
 
    private final EmployeeRepository employeeRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final CompetencyRepository competencyRepository;
    private final GapAnalysisRepository gapAnalysisRepository;
 
    public GapAnalysisService(EmployeeRepository employeeRepository,
                              EmployeeSkillRepository employeeSkillRepository,
                              CompetencyRepository competencyRepository,
                              GapAnalysisRepository gapAnalysisRepository) {
 
        this.employeeRepository = employeeRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.competencyRepository = competencyRepository;
        this.gapAnalysisRepository = gapAnalysisRepository;
    }
 
    @Transactional
    public List<GapAnalysis> generateGapAnalysis(Long employeeId) {
 
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
 
        List<EmployeeSkill> employeeSkills =
                employeeSkillRepository.findByEmployeeId(employeeId);
 
        List<Competency> competencies =
                competencyRepository.findByDepartmentId(employee.getDepartment().getId());
 
        List<GapAnalysis> report = new ArrayList<>();
        gapAnalysisRepository.deleteByEmployeeId(employeeId);
 
        for (Competency competency : competencies) {
 
            for (EmployeeSkill employeeSkill : employeeSkills) {
 
                if (competency.getSkill().getId()
                        .equals(employeeSkill.getSkill().getId())) {
 
                    GapAnalysis gapAnalysis = new GapAnalysis();
 
                    gapAnalysis.setEmployee(employee);
 
                    gapAnalysis.setName(
                            competency.getSkill().getName());
 
                    gapAnalysis.setCurrentLevel(
                            employeeSkill.getLevel());
 
                    gapAnalysis.setRequiredLevel(
                            competency.getRequiredLevel());
 
                    gapAnalysis.setGap(
                            competency.getRequiredLevel()
                                    - employeeSkill.getLevel());
 
                    gapAnalysisRepository.save(gapAnalysis);
 
                    report.add(gapAnalysis);
                }
            }
        }
 
        return report;
    }
 
    public List<GapAnalysis> getEmployeeGapAnalysis(Long employeeId) {
        return gapAnalysisRepository.findByEmployeeId(employeeId);
    }
 
}
 
