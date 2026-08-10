package com.orgkgi.service;

import com.orgkgi.dto.AssessmentRequestDTO;
import com.orgkgi.dto.AssessmentResponseDTO;
import com.orgkgi.entity.*;
import com.orgkgi.repository.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final SkillRepository skillRepository;
    private final CompetencyRepository competencyRepository;
    private final GapAnalysisRepository gapAnalysisRepository;

    public AssessmentService(AssessmentRepository assessmentRepository,
                             EmployeeRepository employeeRepository,
                             EmployeeSkillRepository employeeSkillRepository,
                             SkillRepository skillRepository,
                             CompetencyRepository competencyRepository,
                             GapAnalysisRepository gapAnalysisRepository) {
        this.assessmentRepository = assessmentRepository;
        this.employeeRepository = employeeRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.skillRepository = skillRepository;
        this.competencyRepository = competencyRepository;
        this.gapAnalysisRepository = gapAnalysisRepository;
    }

    public AssessmentResponseDTO submitAssessment(AssessmentRequestDTO request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Skill skill = skillRepository.findBySkillName(request.getSkillName())
                .orElseGet(() -> {
                    Skill newSkill = new Skill();
                    newSkill.setSkillName(request.getSkillName());
                    newSkill.setCategory("General");
                    return skillRepository.save(newSkill);
                });

        Assessment assessment = new Assessment();
        assessment.setEmployee(employee);
        assessment.setAssessmentType(normalizeType(request.getAssessmentType()));
        assessment.setSkillName(skill.getName());
        assessment.setScore(request.getScore());
        assessment.setOverallScore(calculateOverallScore(request.getScore(), request.getAssessmentType()));
        assessment.setComments(request.getComments());
        assessmentRepository.save(assessment);

        EmployeeSkill employeeSkill = employeeSkillRepository.findByEmployeeId(employee.getId()).stream()
                .filter(existing -> existing.getSkill().getId().equals(skill.getId()))
                .findFirst()
                .orElseGet(() -> {
                    EmployeeSkill newSkillLevel = new EmployeeSkill();
                    newSkillLevel.setEmployee(employee);
                    newSkillLevel.setSkill(skill);
                    newSkillLevel.setLevel(1);
                    return newSkillLevel;
                });

        int updatedLevel = normalizeScoreToLevel(request.getScore(), employeeSkill.getLevel());
        employeeSkill.setLevel(updatedLevel);
        employeeSkillRepository.save(employeeSkill);

        recalculateSkillGaps(employee);

        AssessmentResponseDTO response = new AssessmentResponseDTO();
        response.setId(assessment.getId());
        response.setEmployeeId(employee.getId());
        response.setAssessmentType(assessment.getAssessmentType());
        response.setSkillName(assessment.getSkillName());
        response.setScore(assessment.getScore());
        response.setOverallScore(assessment.getOverallScore());
        response.setComments(assessment.getComments());
        response.setCreatedAt(assessment.getCreatedAt());
        return response;
    }

    public List<AssessmentResponseDTO> getAssessmentsByEmployee(Long employeeId) {
        List<Assessment> assessments = assessmentRepository.findByEmployeeId(employeeId);
        List<AssessmentResponseDTO> response = new ArrayList<>();
        for (Assessment assessment : assessments) {
            AssessmentResponseDTO dto = new AssessmentResponseDTO();
            dto.setId(assessment.getId());
            dto.setEmployeeId(assessment.getEmployee().getId());
            dto.setAssessmentType(assessment.getAssessmentType());
            dto.setSkillName(assessment.getSkillName());
            dto.setScore(assessment.getScore());
            dto.setOverallScore(assessment.getOverallScore());
            dto.setComments(assessment.getComments());
            dto.setCreatedAt(assessment.getCreatedAt());
            response.add(dto);
        }
        return response;
    }

    private String normalizeType(String assessmentType) {
        if (assessmentType == null) {
            return "SELF";
        }
        return assessmentType.trim().toUpperCase(Locale.ROOT);
    }

    private int calculateOverallScore(Integer score, String type) {
        int base = score == null ? 0 : score;
        if ("MANAGER".equalsIgnoreCase(type)) {
            return Math.min(5, base + 1);
        }
        if ("PEER".equalsIgnoreCase(type)) {
            return Math.min(5, base);
        }
        return Math.min(5, Math.max(1, base));
    }

    private int normalizeScoreToLevel(Integer score, int currentLevel) {
        int normalized = score == null ? currentLevel : score;
        return Math.max(1, Math.min(5, normalized));
    }

    private void recalculateSkillGaps(Employee employee) {
        List<EmployeeSkill> employeeSkills = employeeSkillRepository.findByEmployeeId(employee.getId());
        List<Competency> competencies = competencyRepository.findByDepartmentId(employee.getDepartment().getId());
        gapAnalysisRepository.deleteAll(gapAnalysisRepository.findByEmployeeId(employee.getId()));

        for (Competency competency : competencies) {
            for (EmployeeSkill employeeSkill : employeeSkills) {
                if (competency.getSkill() != null && employeeSkill.getSkill() != null
                        && competency.getSkill().getId().equals(employeeSkill.getSkill().getId())) {
                    GapAnalysis gapAnalysis = new GapAnalysis();
                    gapAnalysis.setEmployee(employee);
                    gapAnalysis.setName(competency.getSkill().getName());
                    gapAnalysis.setCurrentLevel(employeeSkill.getLevel());
                    gapAnalysis.setRequiredLevel(competency.getRequiredLevel());
                    gapAnalysis.setGap(competency.getRequiredLevel() - employeeSkill.getLevel());
                    gapAnalysisRepository.save(gapAnalysis);
                }
            }
        }
    }
}
