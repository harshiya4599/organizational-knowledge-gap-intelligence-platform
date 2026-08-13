package com.orgkgi.controller;

import com.orgkgi.entity.GapAnalysis;
import com.orgkgi.service.GapAnalysisService;
import com.orgkgi.security.EmployeeAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gap-analysis")
public class GapAnalysisController {

    private final GapAnalysisService gapAnalysisService;
    private final EmployeeAccessService employeeAccessService;

    public GapAnalysisController(GapAnalysisService gapAnalysisService, EmployeeAccessService employeeAccessService) {
        this.gapAnalysisService = gapAnalysisService;
        this.employeeAccessService = employeeAccessService;
    }

    // Generate Gap Analysis
    @PostMapping("/{employeeId}")
    public List<GapAnalysis> generateGapAnalysis(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return gapAnalysisService.generateGapAnalysis(employeeId);
    }

    // Get Existing Gap Analysis
    @GetMapping("/{employeeId}")
    public List<GapAnalysis> getGapAnalysis(@PathVariable Long employeeId, Authentication authentication) {
        employeeAccessService.requireAccess(employeeId, authentication);
        return gapAnalysisService.getEmployeeGapAnalysis(employeeId);
    }
}
