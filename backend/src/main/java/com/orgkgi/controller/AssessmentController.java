package com.orgkgi.controller;

import com.orgkgi.dto.AssessmentRequestDTO;
import com.orgkgi.dto.AssessmentResponseDTO;
import com.orgkgi.service.AssessmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/assessments", "/api/assessments"})
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping
    public ResponseEntity<AssessmentResponseDTO> submitAssessment(@RequestBody AssessmentRequestDTO request) {
        return ResponseEntity.ok(assessmentService.submitAssessment(request));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<List<AssessmentResponseDTO>> getAssessments(@PathVariable Long employeeId) {
        return ResponseEntity.ok(assessmentService.getAssessmentsByEmployee(employeeId));
    }
}
